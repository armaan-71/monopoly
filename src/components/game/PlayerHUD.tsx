import { useGameStore } from "@/store/gameStore";
import PersonIcon from "@mui/icons-material/Person";
import { Avatar, Box, Grid, Paper, Typography } from "@mui/material";

export default function PlayerHUD() {
  const { players, turnIndex } = useGameStore();

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Grid container spacing={2}>
        {players.map((player, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={player.id}>
            <Paper
              elevation={index === turnIndex ? 8 : 1}
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                border:
                  index === turnIndex ? `2px solid ${player.color}` : "none",
                bgcolor:
                  index === turnIndex ? "rgba(0,0,0,0.02)" : "background.paper",
              }}
            >
              <Avatar sx={{ bgcolor: player.color }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {player.name}
                </Typography>
                <Typography
                  variant="body1"
                  color="success.main"
                  fontWeight="bold"
                >
                  ${player.money}
                </Typography>
                <Typography variant="caption" display="block">
                  Pos: {player.position}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
