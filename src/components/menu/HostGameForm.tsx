import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import AvatarSelector from "./AvatarSelector";

interface HostGameFormProps {
  onHost: (name: string, avatarId: string) => Promise<void>;
  loading: boolean;
  error?: string;
}

export default function HostGameForm({
  onHost,
  loading,
  error,
}: HostGameFormProps) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("person");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !avatar) return;
    onHost(name, avatar);
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
          sx={{ color: "text.secondary", mb: 1, display: "block" }}
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
              color: "text.primary",
              bgcolor: "rgba(255,255,255,0.05)",
              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "&:hover fieldset": { borderColor: "primary.main" },
              "&.Mui-focused fieldset": { borderColor: "primary.main" },
            },
          }}
        />
      </Box>

      <Box>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", mb: 1, display: "block" }}
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
        variant="contained"
        size="large"
        disabled={loading || !name}
        sx={{
          py: 1.5,
          fontWeight: 600,
          bgcolor: "primary.main",
          color: "black", // Contrast text since primary is light blue
          "&:hover": {
            bgcolor: "primary.dark",
          },
          "&.Mui-disabled": {
            bgcolor: "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.3)",
          },
        }}
      >
        {loading ? "Creating..." : "Host Game"}
      </Button>
    </Box>
  );
}
