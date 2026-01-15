import PersonIcon from "@mui/icons-material/Person";
import { Box } from "@mui/material";

interface TokenProps {
  color: string;
  size?: number;
}

export default function Token({ color, size = 20 }: TokenProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: color,
        border: "2px solid white",
        boxShadow: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <PersonIcon sx={{ color: "white", fontSize: size * 0.8 }} />
    </Box>
  );
}
