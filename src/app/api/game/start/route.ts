import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { GameState } from "@/types/game";

export async function POST(request: Request) {
  try {
    const { roomId } = await request.json();

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomError || !room)
      return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const gameState = room.game_state as GameState;

    // START GAME LOGIC
    // 1. Set isGameStarted = true
    // 2. Assign random order? (Optional, skipping for now)

    const newState = {
      ...gameState,
      isGameStarted: true,
      lastAction: "Game Started!",
    };

    const { error: updateError } = await supabase
      .from("rooms")
      .update({
        status: "PLAYING",
        game_state: newState as unknown as object,
      })
      .eq("id", roomId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to start game" },
      { status: 500 },
    );
  }
}
