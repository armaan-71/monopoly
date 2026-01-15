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
        bgcolor: "#121212",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      <Container maxWidth="xs">
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{ fontWeight: 300, mb: 4, letterSpacing: 2 }}
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
                color: mode === "join" ? "white !important" : "inherit",
                bgcolor:
                  mode === "join"
                    ? "rgba(255,255,255,0.1) !important"
                    : "transparent",
                borderColor:
                  mode === "join"
                    ? "white !important"
                    : "rgba(255,255,255,0.3)",
              }}
            >
              Join
            </Button>
            <Button
              onClick={() => setMode("host")}
              sx={{
                px: 4,
                color: mode === "host" ? "white !important" : "inherit",
                bgcolor:
                  mode === "host"
                    ? "rgba(255,255,255,0.1) !important"
                    : "transparent",
                borderColor:
                  mode === "host"
                    ? "white !important"
                    : "rgba(255,255,255,0.3)",
              }}
            >
              Host
            </Button>
          </ButtonGroup>
        </Box>

        {mode === "join" ? (
          <JoinGameForm onJoin={onJoin} loading={loading} error={error} />
        ) : (
          <HostGameForm onHost={onHost} loading={loading} error={error} />
        )}
      </Container>
    </Box>
  );
}
