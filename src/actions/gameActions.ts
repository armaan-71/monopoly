import { supabase } from "@/lib/supabase";

export const generateRoomCode = async (): Promise<string> => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check uniqueness
    const { data } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code)
      .single();

    if (!data) isUnique = true;
  }
  return code;
};

export const hostGame = async (
  hostName: string,
  avatarId: string
): Promise<string> => {
  try {
    const code = await generateRoomCode();

    // 1. Create Room
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .insert({
        code,
        status: "LOBBY",
        game_state: {}, // Initial empty state
      })
      .select("id")
      .single();

    if (roomError) throw new Error(roomError.message);
    if (!roomData) throw new Error("Failed to create room");

    const roomId = roomData.id;

    // 2. Add Host Player
    const { error: playerError } = await supabase.from("players").insert({
      room_id: roomId,
      name: hostName,
      avatar_id: avatarId,
      is_host: true,
    });

    if (playerError) throw new Error(playerError.message);

    return roomId; // Redirect to /game/[id] (which is roomId? Or use code?)
    // README says /game/[id]. Ideally we use UUID for URL, code for joining.
    // Let's stick to UUID for the route.
  } catch (error) {
    console.error("Host Game Error:", error);
    throw error;
  }
};

export const joinGame = async (
  code: string,
  playerName: string,
  avatarId: string
): Promise<string> => {
  try {
    // 1. Find Room
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, status")
      .eq("code", code)
      .single(); // Should be unique

    if (roomError || !room) throw new Error("Room not found");

    // 2. Check for Avatar uniqueness in this room
    const { data: existingPlayers, error: playersError } = await supabase
      .from("players")
      .select("avatar_id")
      .eq("room_id", room.id);

    if (playersError) throw new Error("Failed to check room details");

    const takenAvatars = existingPlayers?.map((p: any) => p.avatar_id) || [];
    if (takenAvatars.includes(avatarId)) {
      throw new Error("Avatar already taken. Please choose another.");
    }

    // 3. Add Player
    const { error: joinError } = await supabase.from("players").insert({
      room_id: room.id,
      name: playerName,
      avatar_id: avatarId,
      is_host: false,
    });

    if (joinError) throw new Error(joinError.message);

    return room.id;
  } catch (error) {
    // console.error('Join Game Error:', error);
    // Rethrow to display in UI
    throw error;
  }
};
