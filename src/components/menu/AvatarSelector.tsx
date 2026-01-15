import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FlightIcon from "@mui/icons-material/Flight";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import PetsIcon from "@mui/icons-material/Pets";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import StarIcon from "@mui/icons-material/Star";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import { Box, Paper } from "@mui/material";

const ICONS: Record<string, React.ReactNode> = {
  person: <PersonIcon fontSize="large" />,
  car: <DirectionsCarIcon fontSize="large" />,
  dog: <PetsIcon fontSize="large" />,
  bike: <TwoWheelerIcon fontSize="large" />,
  plane: <FlightIcon fontSize="large" />,
  truck: <LocalShippingIcon fontSize="large" />,
  food: <RestaurantIcon fontSize="large" />,
  star: <StarIcon fontSize="large" />,
};

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatarId: string) => void;
  disabledAvatars?: string[];
}

export default function AvatarSelector({
  selectedAvatar,
  onSelect,
  disabledAvatars = [],
}: AvatarSelectorProps) {
  const avatarIds = Object.keys(ICONS);

  return (
    <Box
      sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}
    >
      {avatarIds.map((id) => (
        <Paper
          key={id}
          elevation={selectedAvatar === id ? 8 : 1}
          sx={{
            aspectRatio: "1/1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: disabledAvatars.includes(id) ? 0.3 : 1,
            pointerEvents: disabledAvatars.includes(id) ? "none" : "auto",
            border:
              selectedAvatar === id
                ? "2px solid white"
                : "1px solid rgba(255,255,255,0.2)",
            bgcolor:
              selectedAvatar === id ? "rgba(255,255,255,0.1)" : "transparent",
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.05)",
              transform: "scale(1.05)",
            },
          }}
          onClick={() => onSelect(id)}
        >
          <Box sx={{ color: selectedAvatar === id ? "white" : "grey.400" }}>
            {ICONS[id]}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
