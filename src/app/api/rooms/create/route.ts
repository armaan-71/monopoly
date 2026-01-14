import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GameState } from '@/types/game';

// Helper to generate a random 4-letter code
const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const INITIAL_GAME_STATE: GameState = {
    turnIndex: 0,
    players: [],
    properties: {},
    lastAction: 'Game created',
    dice: [1, 1],
    isGameStarted: false,
    winner: null,
    log: ['Game created'],
};

export async function POST() {
    try {
        const code = generateRoomCode();

        const { data, error } = await supabase
            .from('rooms')
            .insert({
                code,
                status: 'LOBBY',
                game_state: INITIAL_GAME_STATE as unknown as object, // Cast for JSONB compatibility
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }
}
