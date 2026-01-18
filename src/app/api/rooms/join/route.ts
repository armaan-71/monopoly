import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { GameState, PlayerState } from "@/types/game";

export async function POST(request: Request) {
  try {
    const { roomCode, playerName, avatarId } = await request.json();

    // 1. Find the room
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode.toUpperCase())
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.status !== "LOBBY") {
      return NextResponse.json(
        { error: "Game already started" },
        { status: 400 },
      );
    }

    // 2. Create the player
    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        room_id: room.id,
        name: playerName,
        avatar_id: avatarId,
        is_host: false, // First player logic can be improved later
      })
      .select()
      .single();

    if (playerError) throw playerError;

    // 3. Update the GameState in the room to include this new player
    // Note: In a robust app, we might rely purely on the 'players' table,
    // but our 'game_state' JSON is the source of truth for the engine.
    // So we sync the initial player list into the JSON here.

    // Fetch current state again to be safe (or rely on what we just fetched)
    const currentGameState = room.game_state as GameState;
    const newPlayerState: PlayerState = {
      id: player.id,
      name: playerName,
      money: 1500, // Standard starting money
      position: 0,
      isInJail: false,
      jailTurns: 0,
      avatarId,
      heldCards: [],
      isBankrupt: false,
    };

    const updatedGameState = {
      ...currentGameState,
      players: [...currentGameState.players, newPlayerState],
    };

    const { error: updateError } = await supabase
      .from("rooms")
      .update({ game_state: updatedGameState as unknown as object })
      .eq("id", room.id);

    if (updateError) throw updateError;

    return NextResponse.json({ room, player });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
