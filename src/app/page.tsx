"use client";

import { hostGame, joinGame } from "@/actions/gameActions";
import MainMenu from "@/components/menu/MainMenu";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleHost = async (name: string, avatarId: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const roomId = await hostGame(name, avatarId);
      router.push(`/game/${roomId}`);
    } catch (e: any) {
      setError(e.message || "Failed to create game");
      setLoading(false);
    }
  };

  const handleJoin = async (code: string, name: string, avatarId: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const roomId = await joinGame(code, name, avatarId);
      router.push(`/game/${roomId}`);
    } catch (e: any) {
      setError(e.message || "Failed to join game");
      setLoading(false);
    }
  };

  return (
    <MainMenu
      onHost={handleHost}
      onJoin={handleJoin}
      loading={loading}
      error={error}
    />
  );
}
