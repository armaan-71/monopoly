import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GameState } from '@/types/game';
import { rollDice, getNextPosition, canBuyProperty, didPassGo, calculateRent, handleSpecialTile, canMortgage, canUnmortgage, getMortgageValue, getUnmortgageCost, drawCard, applyCardEffect, canBuildHouse, canSellHouse } from '@/utils/gameLogic';
import { BOARD_CONFIG } from '@/constants/boardConfig';

type ActionType = 'ROLL_DICE' | 'BUY_PROPERTY' | 'END_TURN' | 'MORTGAGE' | 'UNMORTGAGE' | 'DISMISS_CARD' | 'BUILD_HOUSE' | 'SELL_HOUSE' | 'PAY_BAIL' | 'USE_GOJF';

export async function POST(request: Request) {
    try {
        const { roomId, playerId, action, propertyId } = await request.json();

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
        if (gameState.turnIndex !== playerIndex) {
            return NextResponse.json({ error: 'Not your turn' }, { status: 403 });
        }

        let newState = { ...gameState };
        let message = 'Action processed';

        // 2. Process Action
        switch (action as ActionType) {
            case 'ROLL_DICE': {
                const dice = rollDice();
                const diceTotal = dice[0] + dice[1];
                const player = newState.players[playerIndex];
                const auditEvents: string[] = [];

                // Check Jail
                if (player.isInJail) {
                    player.jailTurns += 1;
                    if (dice[0] === dice[1]) {
                        player.isInJail = false;
                        player.jailTurns = 0;
                        message = `${player.name} rolled doubles and got out of Jail!`;
                        auditEvents.push(message);
                    } else if (player.jailTurns >= 3) {
                        if (player.money >= 50) {
                            player.money -= 50;
                            player.isInJail = false;
                            message = `${player.name} paid $50 bail after 3 fails.`;
                            auditEvents.push(message);
                        } else {
                            message = `${player.name} is stuck in Jail.`;
                            // Not logging 'stuck' to save space, unless desired.
                        }
                    } else {
                        message = `${player.name} is in Jail. Rolled ${diceTotal}.`;
                        newState.lastAction = message;
                        newState.dice = dice;
                        break;
                    }
                }

                if (!player.isInJail) {
                    const oldPosition = player.position;
                    const newPosition = getNextPosition(oldPosition, diceTotal);

                    // Update player position
                    player.position = newPosition;
                    newState.dice = dice;

                    // Handle Pass Go
                    if (didPassGo(oldPosition, newPosition)) {
                        player.money += 200;
                        message = `${player.name} rolled ${diceTotal} and passed GO!`;
                        auditEvents.push(`${player.name} passed GO and collected $200`);
                    } else {
                        message = `${player.name} rolled ${diceTotal}`;
                    }

                    // LANDING LOGIC

                    // 1. Check Owner / Rent
                    const propertyState = newState.properties[newPosition];
                    if (propertyState && propertyState.owner && propertyState.owner !== player.id) {
                        const rent = calculateRent(newPosition, newState, diceTotal);
                        if (rent > 0) {
                            player.money -= rent;
                            // Add to owner
                            const ownerIndex = newState.players.findIndex(p => p.id === propertyState.owner);
                            if (ownerIndex !== -1) {
                                newState.players[ownerIndex].money += rent;
                                const rentMsg = `Paid $${rent} rent to ${newState.players[ownerIndex].name}`;
                                message += `. ${rentMsg}.`;
                                auditEvents.push(`${player.name} paid $${rent} rent to ${newState.players[ownerIndex].name}`);
                            }
                        }
                    }

                    // 2. Check Special Tiles (Tax, Jail)
                    const { moneyChange, sendToJail, message: tileMsg } = handleSpecialTile(player, newPosition);
                    if (tileMsg) {
                        message += ` ${tileMsg}`;
                        auditEvents.push(`${player.name} ${tileMsg.charAt(0).toLowerCase() + tileMsg.slice(1)}`);
                    }
                    if (moneyChange !== 0) {
                        player.money += moneyChange;
                    }
                    if (sendToJail) {
                        player.isInJail = true;
                        player.position = 10; // Jail location
                        player.jailTurns = 0;
                    }

                    // 3. Check Cards (Chance / Community Chest)
                    // Only if not already sent to jail by special tile (Go To Jail)
                    if (!sendToJail) {
                        const tileName = BOARD_CONFIG.find(p => p.id === newPosition)?.name;
                        if (tileName === 'Chance' || tileName === 'Community Chest') {
                            const cardType = tileName === 'Chance' ? 'CHANCE' : 'COMMUNITY_CHEST';
                            const card = drawCard(cardType);
                            newState.currentCard = card;

                            const effect = applyCardEffect(card, player, newPosition);

                            // Handle Held Card
                            if (effect.heldCard) {
                                if (!player.heldCards) player.heldCards = [];
                                player.heldCards.push(effect.heldCard);
                            } else {
                                // Only apply normal immediate effects if it wasn't held

                                // Apply changes
                                player.money = effect.newMoney;

                                if (effect.newPosition !== newPosition) {
                                    player.position = effect.newPosition;
                                    // Handle potential "Pass Go" on card movement if needed (simple check)
                                    if (effect.newPosition < newPosition && effect.newPosition === 0) { // e.g. Advance to Go
                                        if (card.text.includes('Collect $200')) {
                                            player.money += 200;
                                        }
                                    }
                                }

                                if (effect.sendToJail) {
                                    player.isInJail = true;
                                    player.position = 10;
                                    player.jailTurns = 0;
                                }
                            }

                            message += ` Drew ${cardType === 'CHANCE' ? 'Chance' : 'Community Chest'}: ${card.text}`;
                            auditEvents.push(`${player.name} drew card: ${card.text}`);
                        }
                    }
                }

                newState.lastAction = message;
                if (!newState.log) newState.log = [];
                if (auditEvents.length > 0) {
                    newState.log.push(...auditEvents);
                }
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

            case 'END_TURN': {
                const nextIndex = (gameState.turnIndex + 1) % gameState.players.length;
                newState.turnIndex = nextIndex;
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
