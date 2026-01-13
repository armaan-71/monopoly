'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { GameState } from '@/types/game';

export function useRealtimeGame(roomId: string) {
    const setGameState = useGameStore((state) => state.setGameState);

    useEffect(() => {
        if (!roomId) return;

        // 1. Initial Fetch (optional, if we want to ensure latest state on mount)
        const fetchFullState = async () => {
            const { data } = await supabase
                .from('rooms')
                .select('game_state')
                .eq('id', roomId)
                .single();

            if (data?.game_state) {
                setGameState(data.game_state as unknown as GameState);
            }
        };
        fetchFullState();

        // 2. Realtime Subscription
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`,
                },
                (payload) => {
                    const newData = payload.new as { game_state: GameState };
                    if (newData.game_state) {
                        console.log('Realtime update received:', newData.game_state.lastAction);
                        setGameState(newData.game_state);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, setGameState]);
}
