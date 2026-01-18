"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { GameState } from "@/types/game";

export function useRealtimeGame(roomId: string) {
  const setGameState = useGameStore((state) => state.setGameState);
  const setRoomCode = useGameStore((state) => state.setRoomCode);

  useEffect(() => {
    if (!roomId) return;

    // 1. Initial Fetch
    const fetchFullState = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("code, game_state")
        .eq("id", roomId)
        .single();

      if (data) {
        if (data.code) setRoomCode(data.code);
        if (data.game_state) {
          setGameState(data.game_state as unknown as GameState);
        }
      }
    };
    fetchFullState();

    // 2. Realtime Subscription
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const newData = payload.new as { game_state: GameState };
          if (newData.game_state) {
            setGameState(newData.game_state);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, setGameState, setRoomCode]);
}
