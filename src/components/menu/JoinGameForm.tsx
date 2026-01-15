import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import AvatarSelector from "./AvatarSelector";

interface JoinGameFormProps {
  onJoin: (code: string, name: string, avatarId: string) => Promise<void>;
  loading: boolean;
  error?: string;
}

export default function JoinGameForm({
  onJoin,
  loading,
  error,
}: JoinGameFormProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("person");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !avatar) return;
    onJoin(code.toUpperCase(), name, avatar);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        maxWidth: 400,
        mx: "auto",
      }}
    >
      <Box>
        <Typography
          variant="caption"
          sx={{ color: "grey.500", mb: 1, display: "block" }}
        >
          Room Code
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Visual 4-box input style from sketch - simplified to one validatable input for now */}
          <TextField
            fullWidth
            variant="outlined"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            slotProps={{
              htmlInput: {
                maxLength: 4,
                style: {
                  textAlign: "center",
                  letterSpacing: 8,
                  textTransform: "uppercase",
                },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                "&:hover fieldset": { borderColor: "white" },
                "&.Mui-focused fieldset": { borderColor: "white" },
              },
            }}
          />
        </Box>
      </Box>

      <Box>
        <Typography
          variant="caption"
          sx={{ color: "grey.500", mb: 1, display: "block" }}
        >
          Your Name
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "white",
              "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
              "&:hover fieldset": { borderColor: "white" },
              "&.Mui-focused fieldset": { borderColor: "white" },
            },
          }}
        />
      </Box>

      <Box>
        <Typography
          variant="caption"
          sx={{ color: "grey.500", mb: 1, display: "block" }}
        >
          Select Avatar
        </Typography>
        <AvatarSelector selectedAvatar={avatar} onSelect={setAvatar} />
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ bgcolor: "rgba(211,47,47,0.1)", color: "#ffcdd2" }}
        >
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="outlined"
        size="large"
        disabled={loading || !code || !name}
        sx={{
          color: "white",
          borderColor: "rgba(255,255,255,0.3)",
          py: 1.5,
          "&:hover": {
            borderColor: "white",
            bgcolor: "rgba(255,255,255,0.05)",
          },
        }}
      >
        {loading ? "Joining..." : "Join Game"}
      </Button>
    </Box>
  );
}
