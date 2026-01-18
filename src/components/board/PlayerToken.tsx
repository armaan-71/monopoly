"use client";

import { motion } from "framer-motion";
import { Avatar, Box, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface PlayerTokenProps {
  name: string;
  color: string;
  index: number;
  isInJail: boolean;
  offset?: number; // For overlapping players
  totalAtSpot?: number;
}

export default function PlayerToken({
  name,
  color,
  index,
  isInJail,
  offset = 0,
  totalAtSpot = 1,
}: PlayerTokenProps) {
  const theme = useTheme();

  // Jail Visuals
  const jailStyle = isInJail
    ? {
        filter: "grayscale(100%)",
        border: "2px solid rgba(0,0,0,0.8)",
        boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.5)", // Simulated bars effect
      }
    : {};

  // Bars overlay element if in jail
  const JailBars = isInJail && (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: "50%",
        background:
          "repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.6) 4px, rgba(0,0,0,0.6) 6px)",
        pointerEvents: "none",
      }}
    />
  );

  return (
    <Tooltip title={name} arrow>
      <Box
        component={motion.div}
        initial={false} // Don't animate on mount, only on change
        animate={{
          scale: [1, 1.2, 1], // Pulse on move
        }}
        transition={{ duration: 0.5 }}
        sx={{
          width: 32,
          height: 32,
          position: "relative",
          zIndex: 20,
          ...jailStyle,
        }}
      >
        <Avatar
          sx={{
            width: "100%",
            height: "100%",
            bgcolor: color,
            color: theme.palette.getContrastText(color),
            fontSize: "0.8rem",
            fontWeight: "bold",
            border: "2px solid white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          {name.substring(0, 2).toUpperCase()}
        </Avatar>
        {JailBars}
      </Box>
    </Tooltip>
  );
}
