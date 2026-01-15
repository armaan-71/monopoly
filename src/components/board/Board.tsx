import komOnlineLogo from "@/assets/images/kom-online.png";
import { BOARD_CONFIG } from "@/constants/boardConfig";
import { useGameStore } from "@/store/gameStore";
import { Box } from "@mui/material";
import PropertyTile from "./PropertyTile";
import Token from "./Token";

export default function Board() {
  const { players, properties } = useGameStore();

  const getTileTokens = (index: number) => {
    return players.filter((p) => p.position === index);
  };

  const Tile = ({ index }: { index: number }) => {
    const config = BOARD_CONFIG[index];
    const propertyState = properties[index];
    const tokens = getTileTokens(index);
    const ownerName = propertyState?.owner
      ? players.find((p) => p.id === propertyState.owner)?.name
      : undefined;

    return (
      <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
        <PropertyTile
          config={config}
          owner={ownerName}
          houses={propertyState?.houses}
        />
        {/* Render Tokens */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            gap: 0.5,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {tokens.map((player) => (
            <Token key={player.id} color={player.color} />
          ))}
        </Box>
      </Box>
    );
  };

  // Render Logic
  // Grid 11x11
  // We will map indices 0-39 to specific grid cells.
  // CSS Grid Area approach might be cleaner to define the ring.

  // Bottom Row: 10 (left) -> 0 (right)
  const bottomRow = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
  // Left Column: 20 (top) -> 11 (bottom) (excluding 20 and 10 which are corners, but let's simplify)
  // Actual sequence on board:
  // 20 21 22 23 24 25 26 27 28 29 30
  // 19                         31
  // 18                         32
  // 17         CENTER          33
  // 16                         34
  // 15                         35
  // 14                         36
  // 13                         37
  // 12                         38
  // 11                         39
  // 10 09 08 07 06 05 04 03 02 01 00

  return (
    <Box
      sx={{
        width: "100%",
        maxHeight: "100vh", // Constrain to viewport
        aspectRatio: "1/1",
        display: "grid",
        gridTemplateColumns: "1.5fr repeat(9, 1fr) 1.5fr",
        gridTemplateRows: "1.5fr repeat(9, 1fr) 1.5fr",
        gap: 0.5,
        bgcolor: "background.default",
        p: 2,
        boxSizing: "border-box",
      }}
    >
      {/* TOP ROW: 20 -> 30 */}
      {[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((idx) => (
        <Box
          key={idx}
          sx={{
            gridRow: 1,
            gridColumn: idx === 20 ? 1 : idx === 30 ? 11 : idx - 19,
          }}
        >
          <Tile index={idx} />
        </Box>
      ))}

      {/* BOTTOM ROW: 10 -> 0 */}
      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((idx) => (
        <Box
          key={idx}
          sx={{
            gridRow: 11,
            // 10 is col 1, 0 is col 11
            // idx 10 -> col 1
            // idx 9 -> col 2
            // ...
            // idx 0 -> col 11
            gridColumn: 11 - idx,
          }}
        >
          <Tile index={idx} />
        </Box>
      ))}

      {/* LEFT COLUMN: 19 -> 11 */}
      {[19, 18, 17, 16, 15, 14, 13, 12, 11].map((idx) => (
        <Box
          key={idx}
          sx={{
            gridColumn: 1,
            gridRow: 21 - idx,
            // 19 -> 21-19 = 2 (correct, just below 20)
            // 11 -> 21-11 = 10 (correct, just above 10)
          }}
        >
          <Tile index={idx} />
        </Box>
      ))}

      {/* RIGHT COLUMN: 31 -> 39 */}
      {[31, 32, 33, 34, 35, 36, 37, 38, 39].map((idx) => (
        <Box
          key={idx}
          sx={{
            gridColumn: 11,
            gridRow: idx - 29,
            // 31 -> 31-29 = 2 (correct, just below 30)
            // 39 -> 39-29 = 10 (correct, just above 0)
          }}
        >
          <Tile index={idx} />
        </Box>
      ))}

      {/* Center Area */}
      <Box
        sx={{
          gridColumn: "2 / 11",
          gridRow: "2 / 11",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(255,255,255,0.8)",
          borderRadius: 2,
        }}
      >
        <Box
          component="img"
          src={komOnlineLogo.src}
          alt="Monopoly"
          sx={{ maxWidth: "80%", opacity: 0.2, display: "none" }} // Hide if no image
        />
        <Box
          sx={{
            typography: "h3",
            fontWeight: "bold",
            color: "primary.main",
            opacity: 0.3,
            transform: "rotate(-45deg)",
          }}
        >
          MONOPOLY
        </Box>
      </Box>
    </Box>
  );
}
