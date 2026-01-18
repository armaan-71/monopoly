"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Chip,
  useTheme,
} from "@mui/material";
import { useGameStore } from "@/store/gameStore";
import { BOARD_CONFIG } from "@/constants/boardConfig";
import { PlayerState } from "@/types/game";

interface TradeModalProps {
  open: boolean;
  onClose: () => void;
  playerId: string;
  roomId: string;
}

export default function TradeModal({
  open,
  onClose,
  playerId,
  roomId,
}: TradeModalProps) {
  const { players, properties } = useGameStore();

  const [targetPlayerId, setTargetPlayerId] = useState<string>("");
  const [offeringProps, setOfferingProps] = useState<number[]>([]);
  const [requestingProps, setRequestingProps] = useState<number[]>([]);
  const [offeringMoney, setOfferingMoney] = useState<number>(0);
  const [requestingMoney, setRequestingMoney] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const me = players.find((p) => p.id === playerId);
  const target = players.find((p) => p.id === targetPlayerId);

  // Filter available players (not me, not bankrupt)
  const validTargets = players.filter(
    (p) => p.id !== playerId && !p.isBankrupt,
  );

  // Get properties
  const myProperties = BOARD_CONFIG.filter(
    (config) => properties[config.id]?.owner === playerId,
  );
  const targetProperties = BOARD_CONFIG.filter(
    (config) => properties[config.id]?.owner === targetPlayerId,
  );

  const theme = useTheme();

  // Helper to get color from theme (matching PropertyTile)
  const getGroupColor = (group: any) => {
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
      case "railroad":
        return "#444444";
      case "utility":
        return "#b0bec5";
      default:
        return theme.palette.grey[300];
    }
  };

  const renderPropertyItem = (
    propConfig: any,
    isSelected: boolean,
    toggle: (id: number) => void,
  ) => {
    const state = properties[propConfig.id];
    const isMortgaged = state?.isMortgaged;
    const color = getGroupColor(propConfig.group);

    return (
      <Paper
        key={propConfig.id}
        elevation={isSelected ? 3 : 1}
        onClick={() => toggle(propConfig.id)}
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1,
          cursor: "pointer",
          borderLeft: `6px solid ${color}`,
          bgcolor: isSelected ? "rgba(25, 118, 210, 0.12)" : "background.paper",
          transition: "all 0.2s",
          "&:hover": {
            bgcolor: isSelected ? "rgba(25, 118, 210, 0.2)" : "action.hover",
          },
        }}
      >
        <Checkbox
          checked={isSelected}
          disableRipple
          size="small"
          sx={{ p: 0.5, mr: 1 }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={500}>
            {propConfig.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {propConfig.group === "special"
              ? "Special"
              : `Value: $${propConfig.price}`}
          </Typography>
        </Box>
        {state?.houses > 0 && (
          <Chip
            label="Houses"
            color="error"
            size="small"
            sx={{ height: 20, fontSize: "0.65rem" }}
          />
        )}
        {isMortgaged && (
          <Chip
            label="M"
            color="default"
            size="small"
            sx={{ ml: 0.5, height: 20, fontSize: "0.65rem" }}
          />
        )}
      </Paper>
    );
  };

  const handlePropose = async () => {
    if (!targetPlayerId) return;
    setLoading(true);

    try {
      await fetch("/api/game/action", {
        method: "POST",
        body: JSON.stringify({
          roomId,
          playerId,
          action: "PROPOSE_TRADE",
          targetPlayerId,
          offering: {
            properties: offeringProps,
            money: offeringMoney,
          },
          requesting: {
            properties: requestingProps,
            money: requestingMoney,
          },
        }),
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to propose trade");
    } finally {
      setLoading(false);
    }
  };

  const toggleOfferProp = (id: number) => {
    setOfferingProps((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const toggleRequestProp = (id: number) => {
    setRequestingProps((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Propose Trade</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* LEFT COLUMN: ME */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%", bgcolor: "rgba(0,255,0,0.05)" }}>
              <Typography variant="h6" gutterBottom>
                You Offer
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Money: ${offeringMoney}</Typography>
                <Slider
                  value={offeringMoney}
                  onChange={(_, val) => setOfferingMoney(val as number)}
                  min={0}
                  max={me?.money || 0}
                  step={10}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Properties
              </Typography>
              {myProperties.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No properties to trade
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {myProperties.map((prop) =>
                    renderPropertyItem(
                      prop,
                      offeringProps.includes(prop.id),
                      toggleOfferProp,
                    ),
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* RIGHT COLUMN: TARGET */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%", bgcolor: "rgba(0,0,255,0.05)" }}>
              <Typography variant="h6" gutterBottom>
                You Request
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Select Player</InputLabel>
                <Select
                  value={targetPlayerId}
                  label="Select Player"
                  onChange={(e) => {
                    setTargetPlayerId(e.target.value);
                    setRequestingProps([]);
                    setRequestingMoney(0);
                  }}
                >
                  {validTargets.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} (${p.money})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {target && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom>
                      Money: ${requestingMoney}
                    </Typography>
                    <Slider
                      value={requestingMoney}
                      onChange={(_, val) => setRequestingMoney(val as number)}
                      min={0}
                      max={target.money}
                      step={10}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    Properties
                  </Typography>
                  {targetProperties.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No properties available
                    </Typography>
                  ) : (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {targetProperties.map((prop) =>
                        renderPropertyItem(
                          prop,
                          requestingProps.includes(prop.id),
                          toggleRequestProp,
                        ),
                      )}
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handlePropose}
          variant="contained"
          disabled={
            !targetPlayerId ||
            loading ||
            (offeringProps.length === 0 &&
              offeringMoney === 0 &&
              requestingProps.length === 0 &&
              requestingMoney === 0)
          }
        >
          Propose Trade
        </Button>
      </DialogActions>
    </Dialog>
  );
}
