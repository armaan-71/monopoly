import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
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
  const [code, setCode] = useState(["", "", "", ""]);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("person");
  const inputRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      const input = inputRefs.current[0].querySelector("input");
      if (input) input.focus();
    }
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste or multi-char entry if simple copy-paste
      const pasted = value.toUpperCase().slice(0, 4).split("");
      const newCode = [...code];
      pasted.forEach((char, i) => {
        if (index + i < 4) newCode[index + i] = char;
      });
      setCode(newCode);
      // Focus last filled
      const nextIndex = Math.min(index + pasted.length, 3);
      const nextInput = inputRefs.current[nextIndex]?.querySelector("input");
      if (nextInput) nextInput.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    // Auto-advance
    if (value && index < 3) {
      const nextInput = inputRefs.current[index + 1]?.querySelector("input");
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1]?.querySelector("input");
      if (prevInput) {
        prevInput.focus();
        // Optional: clear previous on backspace too? Standard OTP behavior usually just moves back.
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 4);
    if (pastedData) {
      const newCode = [...code];
      pastedData.split("").forEach((char, i) => {
        newCode[i] = char;
      });
      setCode(newCode);
      const lastIndex = Math.min(pastedData.length, 3);
      const lastInput = inputRefs.current[lastIndex]?.querySelector("input");
      if (lastInput) lastInput.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 4 || !name || !avatar) return;
    onJoin(fullCode, name, avatar);
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
        width: "100%", // Ensure full width usage
      }}
    >
      <Box>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", mb: 1, display: "block" }}
        >
          Room Code
        </Typography>
        <Box
          sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}
          onPaste={handlePaste}
        >
          {code.map((digit, index) => (
            <TextField
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              variant="outlined"
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              slotProps={{
                htmlInput: {
                  maxLength: 1,
                  style: {
                    textAlign: "center",
                    textTransform: "uppercase",
                    fontSize: "1.5rem",
                    padding: "12px",
                  },
                },
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
                  bgcolor: "rgba(255,255,255,0.05)",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "primary.main" },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                    borderWidth: 2,
                  },
                },
              }}
            />
          ))}
        </Box>
      </Box>

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
        disabled={loading || code.join("").length !== 4 || !name}
        sx={{
          py: 1.5,
          fontWeight: 600,
          bgcolor: "primary.main",
          color: "black", // Contrast text for light blue primary
          "&:hover": {
            bgcolor: "primary.dark",
          },
          "&.Mui-disabled": {
            bgcolor: "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.3)",
          },
        }}
      >
        {loading ? "Joining..." : "Join Game"}
      </Button>
    </Box>
  );
}
