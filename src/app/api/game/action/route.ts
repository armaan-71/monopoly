import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GameState } from '@/types/game';
import { rollDice, getNextPosition, canBuyProperty, didPassGo, calculateRent, handleSpecialTile, canMortgage, canUnmortgage, getMortgageValue, getUnmortgageCost, drawCard, applyCardEffect } from '@/utils/gameLogic';
import { BOARD_CONFIG } from '@/constants/boardConfig';

type ActionType = 'ROLL_DICE' | 'BUY_PROPERTY' | 'END_TURN' | 'MORTGAGE' | 'UNMORTGAGE' | 'DISMISS_CARD';

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

                            // Apply changes
                            player.money = effect.newMoney;

                            if (effect.newPosition !== newPosition) {
                                player.position = effect.newPosition;
                                // Handle potential "Pass Go" on card movement if needed (simple check)
                                if (effect.newPosition < newPosition && effect.newPosition === 0) { // e.g. Advance to Go
                                    // "Advance to Go" usually implies collecting $200. 
                                    // Our applyCardEffect handles exact position. 
                                    // Standard "Pass Go" logic for *movement* via card isn't fully robust here but acceptable for MVP.
                                    // In 'applyCardEffect' we didn't add $200 for passing go, only for "Advance to Go" card value potentially?
                                    // Actually 'Advance to Go' card value is 0 (pos). 
                                    // We rely on the card text "Collect $200" or explicit MONEY action if separated. 
                                    // Standard Monopoly rules: "Advance to Go (Collect $200)". If we move to 0, does the game trigger $200? 
                                    // For now, let's assume the Card Text covers the logic or we just move.
                                    // Actually, standard "Advance to Go" is usually a MOVE card to 0. The $200 comes from "Passing Go" logic which *normally* triggers.
                                    // Since we force position, we should probably check pass go manually or just add money if it's "Advance to Go".
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
