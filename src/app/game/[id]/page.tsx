"use client";

import { Board } from "@/components/board";
import { GameControls, PlayerHUD } from "@/components/game";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { ExitToApp } from "@mui/icons-material";
import { Box, Button, Container, Grid, Paper, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;
  const [roomCode, setRoomCode] = useState<string>("");
  const { lastAction } = useGameStore();

  const handleExit = () => {
    router.push("/");
  };

  useEffect(() => {
    if (roomId) {
      // Fetch room details including code
      const fetchRoomDetails = async () => {
        const { data, error } = await supabase
          .from("rooms")
          .select("code")
          .eq("id", roomId)
          .single();

        if (data) {
          setRoomCode(data.code);
          console.log(`Joined room: ${data.code} (${roomId})`);
        }
        if (error) {
          console.error("Error fetching room code:", error);
        }
      };

      fetchRoomDetails();
    }
  }, [roomId]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            color="primary"
          >
            Monopoly Room: {roomCode}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Paper
              sx={{ px: 2, py: 1, bgcolor: "secondary.main", color: "white" }}
            >
              <Typography variant="body1" fontWeight="bold">
                {lastAction || "Game Started"}
              </Typography>
            </Paper>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ExitToApp />}
              onClick={handleExit}
              sx={{ borderColor: "error.main", color: "error.main" }}
            >
              Exit
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Main Board Area */}
          <Grid size={{ xs: 12, lg: 8, xl: 7 }}>
            <Box sx={{ width: "100%", maxWidth: "900px", mx: "auto" }}>
              <Board />
            </Box>
          </Grid>

          {/* Sidebar Controls */}
          <Grid size={{ xs: 12, lg: 4, xl: 5 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                height: "100%",
              }}
            >
              <GameControls />
              <PlayerHUD />

              {/* Log/Chat Placeholder */}
              <Paper
                sx={{ flexGrow: 1, p: 2, minHeight: 200, bgcolor: "grey.100" }}
              >
                <Typography variant="caption" color="text.secondary">
                  Game Log
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">• Game started</Typography>
                  {/* We could map a log from store here */}
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
