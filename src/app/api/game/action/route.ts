import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GameState } from '@/types/game';
import { rollDice, getNextPosition, canBuyProperty, didPassGo, calculateRent, handleSpecialTile, canMortgage, canUnmortgage, getMortgageValue, getUnmortgageCost, drawCard, applyCardEffect, canBuildHouse, canSellHouse } from '@/utils/gameLogic';
import { BOARD_CONFIG } from '@/constants/boardConfig';

type ActionType = 'ROLL_DICE' | 'BUY_PROPERTY' | 'END_TURN' | 'MORTGAGE' | 'UNMORTGAGE' | 'DISMISS_CARD' | 'BUILD_HOUSE' | 'SELL_HOUSE' | 'PAY_BAIL' | 'USE_GOJF' | 'DECLINE_BUY' | 'PLACE_BID' | 'FOLD_AUCTION' | 'RESOLVE_AUCTION';

export async function POST(request: Request) {
    try {
        const { roomId, playerId, action, propertyId, amount } = await request.json();

        // 1. Fetch current game state
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', roomId)
            .single();

        if (roomError || !room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const gameState = room.game_state as GameState;
        const playerIndex = gameState.players.findIndex((p) => p.id === playerId);

        if (playerIndex === -1) {
            return NextResponse.json({ error: 'Player not found in game' }, { status: 403 });
        }

        // Basic Turn Validation
        // Exception: PAY_BAIL / USE_GOJF can happen if in jail (blocked state)
        // Exception: PLACE_BID / FOLD_AUCTION can happen by ANYONE during auction
        const isTurn = gameState.turnIndex === playerIndex;
        const allowedOutOfTurn = ['PAY_BAIL', 'USE_GOJF', 'PLACE_BID', 'FOLD_AUCTION'];

        if (!isTurn && !allowedOutOfTurn.includes(action)) {
            return NextResponse.json({ error: 'Not your turn' }, { status: 403 });
        }

        let newState = { ...gameState };
        let message = 'Action processed';

        // Initialize hasRolled if missing (migration for existing games)
        if (typeof newState.hasRolled === 'undefined') newState.hasRolled = false;

        // 2. Process Action
        switch (action as ActionType) {
            case 'ROLL_DICE': {
                if (newState.hasRolled && !newState.players[playerIndex].isInJail) {
                    return NextResponse.json({ error: 'You have already rolled' }, { status: 400 });
                }

                const dice = rollDice();
                const diceTotal = dice[0] + dice[1];
                const player = newState.players[playerIndex];
                const auditEvents: string[] = [];
                newState.dice = dice;

                // --- JAIL LOGIC ---
                if (player.isInJail) {
                    player.jailTurns += 1;
                    if (dice[0] === dice[1]) {
                        player.isInJail = false;
                        player.jailTurns = 0;
                        newState.hasRolled = true;
                        message = `${player.name} rolled doubles and escaped Jail!`;
                        auditEvents.push(message);
                    } else if (player.jailTurns >= 3) {
                        if (player.money >= 50) {
                            player.money -= 50;
                            player.isInJail = false;
                            player.jailTurns = 0;
                            newState.hasRolled = true;
                            message = `${player.name} paid $50 bail.`;
                            auditEvents.push(message);
                        } else {
                            newState.hasRolled = true;
                            message = `${player.name} failed doubles and stays in Jail.`;
                            newState.lastAction = message;
                            break;
                        }
                    } else {
                        newState.hasRolled = true;
                        message = `${player.name} stays in Jail.`;
                        newState.lastAction = message;
                        break;
                    }
                }

                // --- MOVEMENT & LANDING ---
                if (!player.isInJail) {
                    // Update hasRolled (Doubles Logic)
                    if (dice[0] === dice[1]) {
                        newState.hasRolled = false;
                        message += " (Doubles! Roll again)";
                    } else {
                        newState.hasRolled = true;
                    }

                    const oldPosition = player.position;
                    // Apply movement
                    const newPosition = getNextPosition(oldPosition, diceTotal);
                    player.position = newPosition;
                    message = `${player.name} rolled ${diceTotal} to ${BOARD_CONFIG.find(t => t.id === newPosition)?.name || 'Unknown'}`;

                    if (didPassGo(oldPosition, newPosition)) {
                        player.money += 200;
                        auditEvents.push(`${player.name} passed GO (+ $200)`);
                    }

                    // 1. Rent Logic
                    const propertyState = newState.properties[newPosition];
                    if (propertyState && propertyState.owner && propertyState.owner !== player.id) {
                        const rent = calculateRent(newPosition, newState, diceTotal);
                        if (rent > 0 && !propertyState.isMortgaged) {
                            player.money -= rent;
                            const owner = newState.players.find(p => p.id === propertyState.owner);
                            if (owner) {
                                owner.money += rent;
                                auditEvents.push(`Paid $${rent} rent to ${owner.name}`);
                            }
                        }
                    }

                    // 2. Special Tiles (Tax, GoToJail)
                    // Note: handleSpecialTile needs (player, position) or just (position, state)? 
                    // Checking previous usage: handleSpecialTile(player, newPosition) was used in lines 119.
                    // But in Step 1570 (original file), it was imported as:
                    // handleSpecialTile(newPosition, newState) ? 
                    // Let's check imports or usage elsewhere.
                    // "handleSpecialTile(newPosition, newState)" was NOT in the imports list in Step 1570?
                    // Step 1570 line 4 imports: rollDice, getNextPosition... handleSpecialTile...
                    // Usage in Step 1570 isn't shown fully.
                    // I'll stick to the usage pattern seen in the file recently: `handleSpecialTile(player, newPosition)`
                    // If that fails, I'll fix it.

                    const { moneyChange, sendToJail, message: tileMsg } = handleSpecialTile(player, newPosition);
                    if (tileMsg) {
                        // tileMsg is usually "Paid Luxury Tax" or similar. Prefix with name if not present.
                        // Check if tileMsg already starts with player name (game logic dependent, but safest to ensure)
                        // Actually handleSpecialTile likely returns "Paid $100 Tax".
                        // adding player name:
                        auditEvents.push(`${player.name}: ${tileMsg}`);
                    }
                    if (moneyChange) player.money += moneyChange;
                    if (sendToJail) {
                        player.isInJail = true;
                        player.position = 10;
                        player.jailTurns = 0;
                        newState.hasRolled = true; // Turn ends
                    }

                    // 3. Cards (Chance/Chest)
                    if (!sendToJail) {
                        const tileName = BOARD_CONFIG.find(p => p.id === newPosition)?.name;
                        if (tileName === 'Chance' || tileName === 'Community Chest') {
                            const cardType = tileName === 'Chance' ? 'CHANCE' : 'COMMUNITY_CHEST';
                            const card = drawCard(cardType);
                            newState.currentCard = card;

                            const drawMsg = `${player.name} drew ${cardType === 'CHANCE' ? 'Chance' : 'Community Chest'}: "${card.text}"`;
                            auditEvents.push(drawMsg);
                            message = drawMsg; // Update main status message to show card outcome

                            const effect = applyCardEffect(card, player, newPosition);
                            if (effect.heldCard) {
                                if (!player.heldCards) player.heldCards = [];
                                player.heldCards.push(effect.heldCard);
                            } else {
                                player.money = effect.newMoney;
                                if (effect.newPosition !== newPosition) {
                                    player.position = effect.newPosition;
                                    // Basic Pass Go check for card movement
                                    if (effect.newPosition < newPosition && effect.newPosition === 0) {
                                        player.money += 200;
                                    }
                                }
                                if (effect.sendToJail) {
                                    player.isInJail = true;
                                    player.position = 10;
                                    player.jailTurns = 0;
                                }
                            }
                        }
                    }
                }

                newState.lastAction = message;
                if (!newState.log) newState.log = [];
                if (auditEvents.length) newState.log.push(...auditEvents);
                break;
            }

            case 'BUY_PROPERTY': {
                const player = newState.players[playerIndex];
                const propertyIndex = player.position;

                // Validation
                const propertyDef = BOARD_CONFIG.find(p => p.id === propertyIndex);
                if (!propertyDef) throw new Error('Invalid property');

                const existingOwner = newState.properties[propertyIndex]?.owner;

                if (canBuyProperty(propertyIndex, player.money, existingOwner || null)) {
                    // Deduct money
                    player.money -= (propertyDef.price || 0);

                    // Set Owner
                    newState.properties[propertyIndex] = {
                        owner: player.id,
                        houses: 0,
                        isMortgaged: false
                    };

                    const msg = `${player.name} bought ${propertyDef.name}`;
                    newState.lastAction = msg;
                    if (!newState.log) newState.log = [];
                    newState.log.push(msg);
                } else {
                    return NextResponse.json({ error: 'Cannot buy this property' }, { status: 400 });
                }
                break;
            }


            case 'MORTGAGE': {
                if (typeof propertyId !== 'number') return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });

                if (canMortgage(propertyId, playerId, gameState)) {
                    const value = getMortgageValue(propertyId);
                    const player = newState.players[playerIndex];
                    const propertyDef = BOARD_CONFIG.find(p => p.id === propertyId);

                    // Execute Mortgage
                    player.money += value;
                    newState.properties[propertyId].isMortgaged = true;

                    const msg = `${player.name} mortgaged ${propertyDef?.name} for $${value}`;
                    newState.lastAction = msg;
                    if (!newState.log) newState.log = [];
                    newState.log.push(msg);
                } else {
                    return NextResponse.json({ error: 'Cannot mortgage this property' }, { status: 400 });
                }
                break;
            }

            case 'UNMORTGAGE': {
                if (typeof propertyId !== 'number') return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });

                const player = newState.players[playerIndex];

                if (canUnmortgage(propertyId, playerId, player.money, gameState)) {
                    const cost = getUnmortgageCost(propertyId);
                    const propertyDef = BOARD_CONFIG.find(p => p.id === propertyId);

                    // Execute Unmortgage
                    player.money -= cost;
                    newState.properties[propertyId].isMortgaged = false;

                    const msg = `${player.name} unmortgaged ${propertyDef?.name} for $${cost}`;
                    newState.lastAction = msg;
                    if (!newState.log) newState.log = [];
                    newState.log.push(msg);
                } else {
                    return NextResponse.json({ error: 'Cannot unmortgage this property' }, { status: 400 });
                }
                break;
            }

            case 'BUILD_HOUSE': {
                if (typeof propertyId !== 'number') return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });

                const validation = canBuildHouse(propertyId, playerId, gameState);
                if (!validation.allowed) {
                    return NextResponse.json({ error: validation.reason }, { status: 400 });
                }

                const propertyDef = BOARD_CONFIG.find(p => p.id === propertyId);
                const player = newState.players[playerIndex];
                const houseCost = propertyDef?.houseCost || 0;

                // Execute Build
                player.money -= houseCost;
                newState.properties[propertyId].houses += 1;

                const newCount = newState.properties[propertyId].houses;
                const type = newCount === 5 ? 'Hotel' : 'House';
                const msg = `${player.name} built a ${type} on ${propertyDef?.name}`;

                newState.lastAction = msg;
                if (!newState.log) newState.log = [];
                newState.log.push(msg);
                break;
            }

            case 'PAY_BAIL': {
                const player = newState.players[playerIndex];
                if (!player.isInJail) return NextResponse.json({ error: 'Not in jail' }, { status: 400 });
                if (player.money < 50) return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });

                player.money -= 50;
                player.isInJail = false;
                player.jailTurns = 0;

                const msg = `${player.name} paid $50 bail`;
                newState.lastAction = msg;
                if (!newState.log) newState.log = [];
                newState.log.push(msg);
                break;
            }

            case 'USE_GOJF': {
                const player = newState.players[playerIndex];
                if (!player.isInJail) return NextResponse.json({ error: 'Not in jail' }, { status: 400 });

                // Check ownership
                // Assuming we simply remove the first JAIL_FREE card found
                // Note: We need to handle this robustly if `heldCards` is array of full objects or IDs.
                // Current types say `heldCards: Card[]`.
                const cardIndex = player.heldCards?.findIndex(c => c.action === 'JAIL_FREE');

                if (cardIndex === undefined || cardIndex === -1) {
                    return NextResponse.json({ error: 'No Get Out of Jail Free card' }, { status: 400 });
                }

                // Remove card
                // Note: We might want to return it to the deck, but deck state is currently stateless random.
                // So just removing from player is sufficient for now.
                if (player.heldCards) {
                    player.heldCards.splice(cardIndex, 1);
                }

                player.isInJail = false;
                player.jailTurns = 0;

                const msg = `${player.name} used a Get Out of Jail Free card`;
                newState.lastAction = msg;
                if (!newState.log) newState.log = [];
                newState.log.push(msg);
                break;
            }

            case 'SELL_HOUSE': {
                if (typeof propertyId !== 'number') return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });

                const validation = canSellHouse(propertyId, playerId, gameState);
                if (!validation.allowed) {
                    return NextResponse.json({ error: validation.reason }, { status: 400 });
                }

                const propertyDef = BOARD_CONFIG.find(p => p.id === propertyId);
                const player = newState.players[playerIndex];
                const houseCost = propertyDef?.houseCost || 0;

                // Execute Sell (Half price)
                const refund = Math.floor(houseCost / 2);
                player.money += refund;
                newState.properties[propertyId].houses -= 1;

                const msg = `${player.name} sold a House/Hotel on ${propertyDef?.name}`;

                newState.lastAction = msg;
                if (!newState.log) newState.log = [];
                newState.log.push(msg);
                break;
            }

            case 'DISMISS_CARD': {
                // Anyone can dismiss? Or only current player?
                // Probably better to allow current player.
                // Reset card
                newState.currentCard = null;
                // No log needed really, it's UI cleanup.
                break;
            }

            case 'DECLINE_BUY': {
                const player = newState.players[playerIndex];
                const propertyId = player.position;

                // Validate property is unowned
                if (newState.properties[propertyId]?.owner) {
                    return NextResponse.json({ error: 'Property already owned' }, { status: 400 });
                }

                // Start Auction
                newState.auction = {
                    propertyId: propertyId,
                    highestBid: 0,
                    highestBidder: null,
                    activeBidders: newState.players.map(p => p.id),
                    status: 'active',
                    endTime: Date.now() + 10000 // 10s timer
                };

                const propertyDef = BOARD_CONFIG.find(p => p.id === propertyId);
                const msg = `Auction started for ${propertyDef?.name}`;
                newState.lastAction = msg;
                if (!newState.log) newState.log = [];
                newState.log.push(msg);
                break;
            }

            case 'PLACE_BID': {
                if (!newState.auction) return NextResponse.json({ error: 'No active auction' }, { status: 400 });
                if (typeof amount !== 'number') return NextResponse.json({ error: 'Missing bid amount' }, { status: 400 });

                const player = newState.players[playerIndex];

                // Validate Bidder
                if (!newState.auction.activeBidders.includes(playerId)) {
                    return NextResponse.json({ error: 'You are not in this auction' }, { status: 400 });
                }

                // Validate Amount
                if (amount <= newState.auction.highestBid) {
                    return NextResponse.json({ error: 'Bid must be higher than current highest' }, { status: 400 });
                }
                if (amount > player.money) {
                    return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
                }

                newState.auction.highestBid = amount;
                newState.auction.highestBidder = playerId;
                newState.auction.endTime = Date.now() + 10000; // Reset timer to 10s

                const msg = `${player.name} bid $${amount}`;
                newState.lastAction = msg;
                break;
            }

            case 'FOLD_AUCTION': {
                if (!newState.auction) return NextResponse.json({ error: 'No active auction' }, { status: 400 });

                const player = newState.players[playerIndex];

                // Check if current highest bidder tries to fold (Prevent it)
                if (newState.auction.highestBidder === playerId) {
                    return NextResponse.json({ error: 'Cannot fold while highest bidder' }, { status: 400 });
                }

                // Remove from active
                newState.auction.activeBidders = newState.auction.activeBidders.filter(id => id !== playerId);

                const msg = `${player.name} folded`;
                newState.lastAction = msg;

                // CHECK WIN CONDITION
                if (newState.auction.activeBidders.length === 1) {
                    const winnerId = newState.auction.activeBidders[0];
                    const winner = newState.players.find(p => p.id === winnerId);

                    // If the last person is also the highest bidder, they win immediately.
                    // Or if they are the only one left and bid > 0. 
                    // Actually if only 1 person remains, the auction ends. 
                    // If they have the highest bid, they pay and get it.
                    // If no one bid (highestBid 0), the last person gets option to buy at face value or it is unowned?
                    // Simplified rules: Last person standing wins at current bid. If bid is 0 (all folded immediately), maybe price is 10? 
                    // For now, assume if 1 left, they win at current `highestBid`. If 0, they get it for free? No, let's say minimum $10.

                    const cost = Math.max(newState.auction.highestBid, 10);
                    const propId = newState.auction.propertyId;
                    const propDef = BOARD_CONFIG.find(p => p.id === propId);

                    if (winner) {
                        // Execute Sale
                        winner.money -= cost;
                        newState.properties[propId] = {
                            owner: winnerId,
                            houses: 0,
                            isMortgaged: false
                        };

                        const winMsg = `${winner.name} won auction for ${propDef?.name} at $${cost}`;
                        newState.lastAction = winMsg;
                        if (!newState.log) newState.log = [];
                        newState.log.push(winMsg);
                    }
                    // End Auction
                    newState.auction = null;

                } else if (newState.auction.activeBidders.length === 0) {
                    // Everyone folded?
                    newState.auction = null;
                    newState.log.push('Auction ended with no winner.');
                }
                break;
            }

            case 'RESOLVE_AUCTION': {
                if (!newState.auction) return NextResponse.json({ error: 'No active auction' }, { status: 400 });

                // Allow a small grace period for network latency (e.g., -500ms? No, trust server time strictly but maybe match client)
                // Actually if client says "Resolve", server checks "Is it time?"
                if (Date.now() < newState.auction.endTime) {
                    return NextResponse.json({ error: 'Auction time not ended yet' }, { status: 400 });
                }

                const winnerId = newState.auction.highestBidder;
                const cost = newState.auction.highestBid;

                if (winnerId) {
                    const winner = newState.players.find(p => p.id === winnerId);
                    const propId = newState.auction.propertyId;
                    const propDef = BOARD_CONFIG.find(p => p.id === propId);

                    if (winner) {
                        winner.money -= cost;
                        newState.properties[propId] = {
                            owner: winnerId,
                            houses: 0,
                            isMortgaged: false
                        };
                        const winMsg = `${winner.name} won auction for ${propDef?.name} at $${cost}`;
                        newState.lastAction = winMsg;
                        if (!newState.log) newState.log = [];
                        newState.log.push(winMsg);
                    }
                } else {
                    newState.lastAction = 'Auction ended with no bids';
                    if (!newState.log) newState.log = [];
                    newState.log.push('Auction ended with no bids');
                }

                newState.auction = null;
                break;
            }

            case 'END_TURN': {
                const nextIndex = (gameState.turnIndex + 1) % gameState.players.length;
                newState.turnIndex = nextIndex;
                newState.hasRolled = false; // Reset for next player
                const msg = `${gameState.players[playerIndex].name} ended their turn`;
                newState.lastAction = msg;
                // No log push for end turn
                break;
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 3. Save to DB
        const { error: updateError } = await supabase
            .from('rooms')
            .update({ game_state: newState as unknown as object })
            .eq('id', roomId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, newState });

    } catch (error) {
        console.error('Game Action Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
