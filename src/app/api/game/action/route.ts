import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GameState } from '@/types/game';
import { rollDice, getNextPosition, canBuyProperty, didPassGo } from '@/utils/gameLogic';
import { BOARD_CONFIG } from '@/constants/boardConfig';

type ActionType = 'ROLL_DICE' | 'BUY_PROPERTY' | 'END_TURN';

export async function POST(request: Request) {
    try {
        const { roomId, playerId, action } = await request.json();

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

                const oldPosition = player.position;
                const newPosition = getNextPosition(oldPosition, diceTotal);

                // Update player position
                player.position = newPosition;
                newState.dice = dice;

                // Handle Pass Go
                if (didPassGo(oldPosition, newPosition)) {
                    player.money += 200;
                    message = `${player.name} rolled ${diceTotal} and passed GO!`;
                } else {
                    message = `${player.name} rolled ${diceTotal}`;
                }

                newState.lastAction = message;
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

                    newState.lastAction = `${player.name} bought ${propertyDef.name}`;
                } else {
                    return NextResponse.json({ error: 'Cannot buy this property' }, { status: 400 });
                }
                break;
            }

            case 'END_TURN': {
                const nextIndex = (gameState.turnIndex + 1) % gameState.players.length;
                newState.turnIndex = nextIndex;
                newState.lastAction = `${gameState.players[playerIndex].name} ended their turn`;
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
