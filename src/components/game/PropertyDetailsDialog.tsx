"use client";

import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Chip,
  Button,
  useTheme,
} from "@mui/material";
import { useGameStore } from "@/store/gameStore";
import CloseIcon from "@mui/icons-material/Close";
import { BOARD_CONFIG } from "@/constants/boardConfig";
import { PropertyGroup } from "@/types/game";
import {
  canMortgage,
  canUnmortgage as canUnmortgageCheck,
  getMortgageValue,
  getUnmortgageCost,
  canBuildHouse,
  canSellHouse,
} from "@/utils/gameLogic";

interface PropertyDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  propertyId: number | null;
  playerId: string | null;
  roomId: string;
}

export default function PropertyDetailsDialog({
  open,
  onClose,
  propertyId,
  playerId,
  roomId,
}: PropertyDetailsDialogProps) {
  const theme = useTheme();
  const { properties, players } = useGameStore();

  // Calculate mortgage value if property accessible
  const propertyDef =
    propertyId !== null ? BOARD_CONFIG.find((p) => p.id === propertyId) : null;
  const mortgageValue = propertyDef?.price
    ? Math.floor(propertyDef.price / 2)
    : 0;

  if (propertyId === null || !propertyDef) return null;

  const propertyState = properties[propertyId];
  const isOwner = propertyState?.owner === playerId;
  const isMortgaged = propertyState?.isMortgaged;

  // Check mortgage eligibility locally for UI feedback (API validates too)
  const canMortgage = isOwner && !isMortgaged && propertyState?.houses === 0;
  const canUnmortgage = isOwner && isMortgaged;

  // Calculate unmortgage cost (Value + 10%)
  const unmortgageCost = Math.floor(mortgageValue * 1.1);

  const getGroupColor = (group: PropertyGroup) => {
    switch (group) {
      case "brown":
        return theme.palette.brown.main;
      case "lightBlue":
        return theme.palette.lightBlue.main;
      case "pink":
        return theme.palette.pink.main;
      case "orange":
        return theme.palette.orange.main;
      case "red":
        return theme.palette.red.main;
      case "yellow":
        return theme.palette.yellow.main;
      case "green":
        return theme.palette.green.main;
      case "darkBlue":
        return theme.palette.darkBlue.main;
      default:
        return theme.palette.grey[800];
    }
  };

  const headerColor =
    propertyDef.group !== "none"
      ? getGroupColor(propertyDef.group)
      : theme.palette.grey[800];
  const isSpecial = propertyDef.group === "special"; // Railroads / Utilities
  const isColorSet =
    propertyDef.group !== "none" && propertyDef.group !== "special";

  // Derived state for the dialog
  const gameState = { properties, players } as any; // Quick cast or use proper state construction if needed for helpers.
  // Actually the helpers expect full GameState. We only have pieces from store.
  // The helpers `canBuildHouse` require `gameState.properties` and `gameState.players`.
  // Let's reconstruct a minimal gameState object for validation
  const _validationGameState = {
    properties,
    players: players,
  } as any;

  const handleAction = async (
    action: "MORTGAGE" | "UNMORTGAGE" | "BUILD_HOUSE" | "SELL_HOUSE",
  ) => {
    if (!roomId || !playerId || propertyId === null) return;

    try {
      const res = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          playerId,
          action,
          propertyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Action failed");
      } else {
        // Success - close dialog or keep open?
        // Keep open to see status change is better UX.
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "background.paper",
          border: `2px solid ${theme.palette.divider}`,
        },
      }}
    >
      {/* Deed Header */}
      <Box
        sx={{
          bgcolor: headerColor,
          p: 3,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.getContrastText(headerColor),
          borderBottom: `2px solid ${theme.palette.divider}`,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "inherit",
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.8 }}>
          TITLE DEED
        </Typography>
        <Typography
          variant="h5"
          sx={{ fontWeight: 900, textAlign: "center", lineHeight: 1.2 }}
        >
          {propertyDef.name.toUpperCase()}
        </Typography>
        {isMortgaged && (
          <Chip
            label="MORTGAGED"
            color="error"
            sx={{
              mt: 1,
              bgcolor: "error.main",
              color: "white",
              fontWeight: "bold",
              border: "2px solid white",
            }}
          />
        )}
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {propertyDef.price ? (
          <Box sx={{ p: 2 }}>
            {/* Rent Table for Color Properties */}
            {!isMortgaged && isColorSet && propertyDef.rent && (
              <Table
                size="small"
                sx={{ "& td": { borderBottom: "none", py: 0.5 } }}
              >
                <TableBody>
                  <TableRow>
                    <TableCell>Rent</TableCell>
                    <TableCell align="right">${propertyDef.rent[0]}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>With 1 House</TableCell>
                    <TableCell align="right">${propertyDef.rent[1]}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>With 2 Houses</TableCell>
                    <TableCell align="right">${propertyDef.rent[2]}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>With 3 Houses</TableCell>
                    <TableCell align="right">${propertyDef.rent[3]}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>With 4 Houses</TableCell>
                    <TableCell align="right">${propertyDef.rent[4]}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      With HOTEL
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      ${propertyDef.rent[5]}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}

            {/* Mortgaged State Message */}
            {isMortgaged && (
              <Box sx={{ py: 4, textAlign: "center", color: "error.main" }}>
                <Typography variant="h6" fontWeight="bold">
                  THIS PROPERTY IS MORTGAGED
                </Typography>
                <Typography variant="body2">
                  No rent can be collected.
                </Typography>
              </Box>
            )}

            {/* Special Properties (Railroads / Utilities) */}
            {!isMortgaged && isSpecial && propertyDef.group === "special" && (
              <Box sx={{ py: 2, textAlign: "center" }}>
                {propertyDef.name.includes("Railroad") ? (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Rent: $25
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      If 2 Railroads are owned: $50
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      If 3 Railroads are owned: $100
                    </Typography>
                    <Typography variant="body2">
                      If 4 Railroads are owned: $200
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      If one "Utility" is owned rent is 4 times amount shown on
                      dice.
                    </Typography>
                    <Typography variant="body2">
                      If both "Utilities" are owned rent is 10 times amount
                      shown on dice.
                    </Typography>
                  </>
                )}
              </Box>
            )}

            <Box sx={{ my: 2, height: 1, bgcolor: "divider" }} />

            {/* Mortgage & House Cost Stats */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                textAlign: "center",
              }}
            >
              <Typography variant="body2">
                Mortgage Value: <strong>${mortgageValue}</strong>
              </Typography>
              {propertyDef.houseCost && (
                <Typography variant="body2">
                  Houses cost <strong>${propertyDef.houseCost}</strong> each
                </Typography>
              )}
              {propertyDef.houseCost && (
                <Typography variant="body2">
                  Hotels cost <strong>${propertyDef.houseCost}</strong> plus 4
                  houses
                </Typography>
              )}
            </Box>

            {/* Actions */}
            {isOwner && (
              <Box
                sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}
              >
                {/* Housing Actions */}
                {!isMortgaged && propertyDef.houseCost && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      disabled={
                        !canBuildHouse(
                          propertyId,
                          playerId!,
                          _validationGameState,
                        ).allowed
                      }
                      onClick={() => handleAction("BUILD_HOUSE")}
                    >
                      Build (-${propertyDef.houseCost})
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      disabled={
                        !canSellHouse(
                          propertyId,
                          playerId!,
                          _validationGameState,
                        ).allowed
                      }
                      onClick={() => handleAction("SELL_HOUSE")}
                    >
                      Sell (+${Math.floor(propertyDef.houseCost / 2)})
                    </Button>
                  </Box>
                )}

                {/* Mortgage Actions */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  {isMortgaged ? (
                    <Button
                      fullWidth
                      variant="contained"
                      color="warning"
                      onClick={() => handleAction("UNMORTGAGE")}
                    >
                      Unmortgage (-${unmortgageCost})
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="warning"
                      disabled={propertyState?.houses > 0} // Can't mortgage if houses exist
                      onClick={() => handleAction("MORTGAGE")}
                    >
                      Mortgage (+${mortgageValue})
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1">
              {propertyDef.description || "No details available."}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
