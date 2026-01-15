"use client";

import { Board } from "@/components/board";
import { GameControls, PlayerHUD } from "@/components/game";
import { useGameStore } from "@/store/gameStore";
import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function GamePage() {
  const params = useParams();
  const roomId = params?.id as string;
  const { lastAction } = useGameStore();

  useEffect(() => {
    // Here we would join the supabase channel for roomId
    console.log(`Joined room: ${roomId}`);
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
            Monopoly Room: {roomId}
          </Typography>
          <Paper
            sx={{ px: 2, py: 1, bgcolor: "secondary.main", color: "white" }}
          >
            <Typography variant="body1" fontWeight="bold">
              {lastAction}
            </Typography>
          </Paper>
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
