import { BOARD_CONFIG } from "@/constants/boardConfig";
import { useGameStore } from "@/store/gameStore";
import { canBuyProperty } from "@/utils/gameLogic";
import CasinoIcon from "@mui/icons-material/Casino";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import { Box, Button, Paper, Typography } from "@mui/material";

export default function GameControls() {
  const {
    turnIndex,
    players,
    dice,
    movePlayer,
    endTurn,
    setGameState,
    properties,
    buyProperty,
  } = useGameStore();

  const currentPlayer = players[turnIndex];
  const currentTileConfig = BOARD_CONFIG[currentPlayer.position];
  const currentPropertyState = properties[currentPlayer.position];

  const handleRollDice = () => {
    // 1. Roll Dice
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setGameState({
      dice: [d1, d2],
      lastAction: `${currentPlayer.name} rolled ${d1 + d2}`,
    });

    // 2. Move Player
    movePlayer(currentPlayer.id, d1 + d2);

    // Logic for landing would handle rent payment automatically or prompt user
    // For now, we just move.
  };

  const handleBuy = () => {
    if (canBuyProperty(currentPlayer, currentPlayer.position)) {
      buyProperty(currentPlayer.id, currentPlayer.position);
      setGameState({
        players: players.map((p) =>
          p.id === currentPlayer.id
            ? { ...p, money: p.money - currentTileConfig.price }
            : p
        ),
        lastAction: `${currentPlayer.name} bought ${currentTileConfig.name}`,
      });
    }
  };

  const canBuy =
    currentTileConfig &&
    ["property", "railroad", "utility"].includes(currentTileConfig.type) &&
    !currentPropertyState?.owner &&
    currentTileConfig.price <= currentPlayer.money;

  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 300,
      }}
    >
      <Typography variant="h6">Controls</Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <CasinoIcon fontSize="large" color="primary" />
        <Typography variant="h4">
          {dice[0]} + {dice[1]} = {dice[0] + dice[1]}
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="large"
        onClick={handleRollDice}
        startIcon={<CasinoIcon />}
      >
        Roll Dice
      </Button>

      <Button
        variant="outlined"
        color="success"
        disabled={!canBuy}
        onClick={handleBuy}
      >
        Buy {currentTileConfig?.name} (${currentTileConfig?.price})
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onClick={endTurn}
        startIcon={<SkipNextIcon />}
      >
        End Turn
      </Button>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Current Turn:
        </Typography>
        <Typography variant="h6" color={currentPlayer.color} fontWeight="bold">
          {currentPlayer.name}
        </Typography>
      </Box>
    </Paper>
  );
}
