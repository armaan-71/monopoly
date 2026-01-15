import { PropertyConfig } from "@/constants/boardConfig";
import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface PropertyTileProps {
  config: PropertyConfig;
  owner?: string; // Player Name
  houses?: number;
  highlight?: boolean;
}

export default function PropertyTile({
  config,
  owner,
  houses = 0,
  highlight = false,
}: PropertyTileProps) {
  const theme = useTheme();

  const colorMap: Record<string, string> = {
    brown: theme.palette.brown.main,
    lightBlue: theme.palette.lightBlue.main,
    pink: theme.palette.pink.main,
    orange: theme.palette.orange.main,
    red: theme.palette.red.main,
    yellow: theme.palette.yellow.main,
    green: theme.palette.green.main,
    darkBlue: theme.palette.darkBlue.main,
    station: theme.palette.grey[800],
    utility: theme.palette.grey[600],
    none: "transparent",
  };

  const headerColor = colorMap[config.colorGroup] || "transparent";
  const showHeader = config.type === "property";

  return (
    <Paper
      elevation={highlight ? 6 : 1}
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${theme.palette.divider}`,
        position: "relative",
        bgcolor: highlight ? "action.hover" : "background.paper",
        overflow: "hidden",
      }}
    >
      {showHeader && (
        <Box
          sx={{
            bgcolor: headerColor,
            height: "20%",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        />
      )}

      <Box
        sx={{
          flexGrow: 1,
          p: 0.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontSize: "0.65rem", fontWeight: "bold", lineHeight: 1.1 }}
        >
          {config.name}
        </Typography>

        {/* Special Icons could go here for Chance/Chest/Railroad */}

        {config.price > 0 && (
          <Typography variant="caption" sx={{ mt: 0.5, fontSize: "0.6rem" }}>
            ${config.price}
          </Typography>
        )}
      </Box>

      {/* Owner Indicator */}
      {owner && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "rgba(0,0,0,0.8)",
            color: "white",
            textAlign: "center",
            p: 0.2,
          }}
        >
          <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
            {owner}
          </Typography>
        </Box>
      )}

      {/* House Indicator */}
      {houses > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: showHeader ? "2%" : 0,
            width: "100%",
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.7rem",
              color: "white",
              fontWeight: "bold",
              textShadow: "0px 0px 2px black",
            }}
          >
            {houses === 5 ? "HOTEL" : "🏠".repeat(houses)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
