"use client";

import { Box } from "@mui/material";
import { motion } from "framer-motion";
import PropertyTile from "./PropertyTile";
import PlayerToken from "./PlayerToken";
import { BOARD_CONFIG } from "@/constants/boardConfig";
import { useGameStore } from "@/store/gameStore";
import { getGridPosition } from "@/constants/visuals";

export default function Board({
  children,
  onPropertyClick,
}: {
  children?: React.ReactNode;
  onPropertyClick?: (id: number) => void;
}) {
  const { players, properties } = useGameStore();

  // Helper to find owner index
  const getOwnerIndex = (propertyId: number) => {
    const ownerId = properties[propertyId]?.owner;
    if (!ownerId) return -1;
    return players.findIndex((p) => p.id === ownerId);
  };

  // Helper to get owner name
  const getOwnerName = (propertyId: number) => {
    const index = getOwnerIndex(propertyId);
    if (index === -1) return undefined;
    return players[index]?.name;
  };

  // Tiles 0-10 (Bottom Row, Right to Left)
  const bottomRow = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
  // Tiles 11-19 (Left Column, Bottom to Top)
  const leftCol = [19, 18, 17, 16, 15, 14, 13, 12, 11];
  // Tiles 20-30 (Top Row, Left to Right)
  const topRow = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  // Tiles 31-39 (Right Column, Top to Bottom)
  const rightCol = [31, 32, 33, 34, 35, 36, 37, 38, 39];

  const renderTile = (index: number) => (
    <Box
      key={index}
      sx={{
        width: "100%",
        height: "100%",
        cursor: "pointer",
        transition: "transform 0.1s",
        "&:hover": {
          transform: "scale(1.02)",
          zIndex: 10,
          boxShadow: 4,
        },
      }}
      onClick={() => onPropertyClick?.(index)}
    >
      <PropertyTile
        config={BOARD_CONFIG[index]}
        state={properties[index]}
        // playersOnTile removed - handled by PlayerLayer
        ownerIndex={getOwnerIndex(index)}
        ownerName={getOwnerName(index)}
      />
    </Box>
  );

  return (
    <Box
      sx={{
        display: "grid",
        // Standard Monopoly has corners ~1.6x larger than tiles
        // 1.6 + 9 + 1.6 = 12.2 total units
        gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
        gridTemplateRows: "repeat(11, minmax(0, 1fr))",
        gap: 0.5,
        width: "100%",
        maxWidth: "850px",
        aspectRatio: "1/1",
        margin: "0 auto",
        p: 1,
        bgcolor: "transparent",
        position: "relative", // For PlayerLayer
      }}
    >
      {/* Top Row (20-30) */}
      {topRow.map((i, idx) => (
        <Box key={i} sx={{ gridColumn: idx + 1, gridRow: 1 }}>
          {renderTile(i)}
        </Box>
      ))}

      {/* Right Column (31-39) -> gridRow 2 to 10, gridColumn 11 */}
      {rightCol.map((i, idx) => (
        <Box key={i} sx={{ gridColumn: 11, gridRow: idx + 2 }}>
          {renderTile(i)}
        </Box>
      ))}

      {/* Bottom Row (10-0 in reverse, so 10 is at col 1, 0 is at col 11) */}
      {bottomRow.map((i, idx) => (
        <Box key={i} sx={{ gridColumn: idx + 1, gridRow: 11 }}>
          {renderTile(i)}
        </Box>
      ))}

      {/* Left Column (19-11 in reverse, so 19 is at row 2, 11 is at row 10) */}
      {leftCol.map((i, idx) => (
        <Box key={i} sx={{ gridColumn: 1, gridRow: idx + 2 }}>
          {renderTile(i)}
        </Box>
      ))}

      {/* Center Area (Logo + Children) */}
      <Box
        sx={{
          gridColumn: "2 / span 9",
          gridRow: "2 / span 9",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#1E1E1E", // Darker Card color for center
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Active Controls in Center */}
        <Box
          sx={{
            zIndex: 2,
            width: "100%",
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {children}
        </Box>
      </Box>

      {/* PLAYER LAYER */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none", // Allow clicking through to tiles
          zIndex: 50,
          display: "grid",
          gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
          gridTemplateRows: "repeat(11, minmax(0, 1fr))",
          gap: 0.5,
        }}
      >
        {players.map((player, index) => {
          const { gridColumn, gridRow } = getGridPosition(player.position);

          // Jail Offset Logic
          // If in Jail (Pos 10), shift to center/inner.
          // If Just Visiting (Pos 10), shift to outer track.
          let jailTransform = "";
          if (player.position === 10) {
            if (player.isInJail) {
              // Inner Cell (Top Right of Bottom Left tile)
              jailTransform = "translate(25%, -25%)";
            } else {
              // Visiting (Outer Track)
              jailTransform = "translate(-30%, 30%)";
            }
          }

          return (
            <Box
              component={motion.div}
              layout // <--- This magic prop animates grid changes!
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              key={player.id}
              sx={{
                gridColumn,
                gridRow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: jailTransform, // Apply Jail shift
                zIndex: 100, // Ensure above board
              }}
            >
              <PlayerToken
                name={player.name}
                color={["#f44336", "#2196f3", "#4caf50", "#ffeb3b"][index % 4]}
                index={player.position}
                isInJail={player.isInJail}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
