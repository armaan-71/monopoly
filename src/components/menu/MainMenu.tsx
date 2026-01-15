import { Box, Button, ButtonGroup, Container, Typography } from "@mui/material";
import { useState } from "react";
import HostGameForm from "./HostGameForm";
import JoinGameForm from "./JoinGameForm";

interface MainMenuProps {
  onHost: (name: string, avatarId: string) => Promise<void>;
  onJoin: (code: string, name: string, avatarId: string) => Promise<void>;
  loading: boolean;
  error?: string;
}

export default function MainMenu({
  onHost,
  onJoin,
  loading,
  error,
}: MainMenuProps) {
  const [mode, setMode] = useState<"join" | "host">("join");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start", // Start from top
        padding: 4,
        color: "text.primary",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="xs">
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 300,
            mb: 4,
            letterSpacing: 2,
            color: "text.primary",
          }}
        >
          Monopoly
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 6 }}>
          <ButtonGroup
            variant="outlined"
            sx={{
              "& .MuiButton-root": {
                borderColor: "rgba(255,255,255,0.3)",
                color: "rgba(255,255,255,0.5)",
              },
            }}
          >
            <Button
              onClick={() => setMode("join")}
              sx={{
                px: 4,
                color:
                  mode === "join"
                    ? "text.primary !important"
                    : "text.secondary",
                bgcolor:
                  mode === "join"
                    ? "rgba(255,255,255,0.1) !important"
                    : "transparent",
                borderColor:
                  mode === "join"
                    ? "text.primary !important"
                    : "rgba(255,255,255,0.3)",
              }}
            >
              Join
            </Button>
            <Button
              onClick={() => setMode("host")}
              sx={{
                px: 4,
                color:
                  mode === "host"
                    ? "text.primary !important"
                    : "text.secondary",
                bgcolor:
                  mode === "host"
                    ? "rgba(255,255,255,0.1) !important"
                    : "transparent",
                borderColor:
                  mode === "host"
                    ? "text.primary !important"
                    : "rgba(255,255,255,0.3)",
              }}
            >
              Host
            </Button>
          </ButtonGroup>
        </Box>

        <Box sx={{ minHeight: 400 }}>
          {" "}
          {/* Fixed container height to prevent shift */}
          {mode === "join" ? (
            <JoinGameForm onJoin={onJoin} loading={loading} error={error} />
          ) : (
            <HostGameForm onHost={onHost} loading={loading} error={error} />
          )}
        </Box>
      </Container>
    </Box>
  );
}
