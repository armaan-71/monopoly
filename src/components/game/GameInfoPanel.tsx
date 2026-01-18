"use client";

import {
  Box,
  Paper,
  Typography,
  Divider,
  Avatar,
  useTheme,
} from "@mui/material";
import { useGameStore } from "@/store/gameStore";
import { getPlayerColor } from "@/constants/visuals";

export default function GameInfoPanel({
  playerId,
}: {
  playerId: string | null;
}) {
  const { code, players, turnIndex } = useGameStore();
  const theme = useTheme();

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}
    >
      {/* Room Info */}
      <Paper sx={{ p: 2, bgcolor: "background.paper", borderRadius: 3 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 1 }}
        >
          Room Code
        </Typography>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ color: "primary.main", letterSpacing: 2 }}
        >
          {code}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Share this code to invite friends
        </Typography>
      </Paper>

      {/* Players List */}
      <Paper
        sx={{ p: 2, bgcolor: "background.paper", borderRadius: 3, flex: 1 }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Players
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
          {players.map((p, index) => {
            const isTurn = index === turnIndex;
            const isMe = p.id === playerId;
            const pColor = getPlayerColor(index);
            const initials = p.name.substring(0, 2).toUpperCase();

            return (
              <Box
                key={p.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isTurn ? "rgba(255, 255, 255, 0.05)" : "transparent",
                  border: isTurn
                    ? `1px solid ${pColor}`
                    : "1px solid transparent", // Border matches player color on turn
                  transition: "all 0.2s ease",
                  boxShadow: isTurn ? `inset 0 0 10px ${pColor}20` : "none",
                }}
              >
                {/* Avatar / Token */}
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: pColor,
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    color: "#fff",
                    border: "2px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {initials}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={isTurn ? 700 : 400}>
                    {p.name} {isMe && "(You)"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${p.money}
                  </Typography>
                </Box>

                {isMe && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "success.main",
                      boxShadow: "0 0 8px #66bb6a",
                    }}
                    title="This is you"
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Chat Placeholder (Future) */}
      <Paper
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 3,
          height: "200px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
          Live Chat
        </Typography>
        <Box
          sx={{
            flex: 1,
            border: "1px dashed rgba(255,255,255,0.1)",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Chat coming soon...
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
