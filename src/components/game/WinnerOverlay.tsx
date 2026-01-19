"use client";

import { useGameStore } from "@/store/gameStore";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import {
  Avatar,
  Box,
  Button,
  keyframes,
  Paper,
  Typography,
} from "@mui/material";

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-30px);}
  60% {transform: translateY(-15px);}
`;

export default function WinnerOverlay({ roomId }: { roomId: string }) {
  const { winner, players, isGameStarted } = useGameStore();

  if (!winner) return null;

  const winnerPlayer = players.find((p) => p.id === winner);

  // Helper to get player color (matching Board/PlayerToken logic)
  const getPlayerColor = (pId: string) => {
    const index = players.findIndex((p) => p.id === pId);
    if (index === -1) return "#999";
    return ["#f44336", "#2196f3", "#4caf50", "#ffeb3b"][index % 4];
  };

  const handleBackToLobby = async () => {
    try {
      await fetch("/api/game/action", {
        method: "POST",
        body: JSON.stringify({
          roomId,
          playerId: winner, // Using winner's ID to authorize reset, but could be anyone
          action: "RESET_GAME",
        }),
      });
      // State update will come via subscription, clearing 'winner' and closing this overlay
    } catch (e) {
      console.error("Failed to reset game", e);
      window.location.reload(); // Fallback
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        bgcolor: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.5s ease-out",
      }}
    >
      <Paper
        elevation={24}
        sx={{
          p: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          maxWidth: 500,
          width: "90%",
          bgcolor: "background.paper",
          borderRadius: 4,
          border: "2px solid gold",
          boxShadow: "0 0 50px rgba(255, 215, 0, 0.3)",
        }}
      >
        <EmojiEventsIcon
          sx={{
            fontSize: 80,
            color: "gold",
            animation: `${bounce} 2s infinite`,
          }}
        />

        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h3"
            fontWeight="900"
            sx={{
              background: "linear-gradient(45deg, #FFD700 30%, #FF8C00 90%)",
              backgroundClip: "text",
              textFillColor: "transparent",
              mb: 1,
            }}
          >
            VICTORY!
          </Typography>
          <Typography variant="h5" color="text.secondary">
            The winner is
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              width: 120,
              height: 120,
              fontSize: "3rem",
              bgcolor: winnerPlayer
                ? getPlayerColor(winnerPlayer.id)
                : "primary.main",
              border: "4px solid white",
              boxShadow: 3,
            }}
          >
            {winnerPlayer?.name.substring(0, 2).toUpperCase()}
          </Avatar>

          <Typography variant="h4" fontWeight="bold">
            {winnerPlayer?.name || "Unknown Player"}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Last player standing!
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={handleBackToLobby}
          sx={{
            mt: 2,
            px: 4,
            py: 1.5,
            fontSize: "1.2rem",
            fontWeight: "bold",
            borderRadius: 8,
            textTransform: "none",
          }}
        >
          Back to Lobby
        </Button>
      </Paper>
    </Box>
  );
}
