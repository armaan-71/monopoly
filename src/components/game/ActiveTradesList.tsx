'use client';

import { Box, Paper, Typography, Button, Chip, Avatar, useTheme } from '@mui/material';
import { useGameStore } from '@/store/gameStore';
import { BOARD_CONFIG } from '@/constants/boardConfig';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { PropertyGroup } from '@/types/game';

export default function ActiveTradesList({ playerId, roomId }: { playerId: string; roomId: string }) {
    const theme = useTheme();
    const { trades, players, properties } = useGameStore();

    if (!trades || trades.length === 0) return null;

    const performAction = async (action: string, tradeId: string) => {
        try {
            const res = await fetch('/api/game/action', {
                method: 'POST',
                body: JSON.stringify({ roomId, playerId, action, tradeId })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Action failed');
            }
        } catch (err) {
            console.error(err);
            alert('Network error');
        }
    };

    // Helper to get color from theme (matching PropertyTile)
    const getGroupColor = (group: PropertyGroup) => {
        switch (group) {
            case 'brown': return theme.palette.brown.main;
            case 'lightBlue': return theme.palette.lightBlue.main;
            case 'pink': return theme.palette.pink.main;
            case 'orange': return theme.palette.orange.main;
            case 'red': return theme.palette.red.main;
            case 'yellow': return theme.palette.yellow.main;
            case 'green': return theme.palette.green.main;
            case 'darkBlue': return theme.palette.darkBlue.main;
            case 'railroad': return '#444444';
            case 'utility': return '#b0bec5';
            default: return theme.palette.grey[300];
        }
    };

    // Helper to get player color (matching Board/PlayerToken logic)
    const getPlayerColor = (pId: string) => {
        const index = players.findIndex(p => p.id === pId);
        if (index === -1) return '#999';
        return ['#f44336', '#2196f3', '#4caf50', '#ffeb3b'][index % 4];
    };

    const PropertyCard = ({ id }: { id: number }) => {
        const config = BOARD_CONFIG.find(p => p.id === id);
        if (!config) return null;

        const state = properties[id];
        const color = getGroupColor(config.group);

        return (
            <Paper
                elevation={1}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 0.75,
                    borderLeft: `4px solid ${color}`,
                    bgcolor: 'background.paper',
                }}
            >
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold" fontSize="0.75rem">{config.name}</Typography>
                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                        {config.group === 'special' ? 'Special' : `$${config.price}`}
                    </Typography>
                </Box>
                {state?.houses > 0 && <Chip label="Houses" color="error" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />}
                {state?.isMortgaged && <Chip label="M" color="default" size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }} />}
            </Paper>
        );
    };

    const activeTrades = trades.filter(t => t.status === 'pending');
    if (activeTrades.length === 0) return null;

    return (
        <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', mt: 2 }}>
            <Typography variant="overline" color="text.secondary" fontWeight="bold">
                Active Trades ({activeTrades.length})
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                {activeTrades.map(trade => {
                    const fromPlayer = players.find(p => p.id === trade.fromPlayerId);
                    const toPlayer = players.find(p => p.id === trade.toPlayerId);

                    const isIncoming = trade.toPlayerId === playerId;
                    const isOutgoing = trade.fromPlayerId === playerId;

                    return (
                        <Paper
                            key={trade.id}
                            elevation={3}
                            sx={{
                                p: 1.5,
                                bgcolor: isIncoming ? 'rgba(76, 175, 80, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                                borderLeft: isIncoming ? '4px solid #4caf50' : isOutgoing ? '4px solid #90caf9' : '4px solid #bdbdbd'
                            }}
                        >
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 1, alignItems: 'start' }}>
                                {/* Left: Proposer (Gives) */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        {fromPlayer && (
                                            <Avatar
                                                sx={{
                                                    width: 24, height: 24, fontSize: '0.75rem',
                                                    bgcolor: getPlayerColor(fromPlayer.id),
                                                    border: '1px solid rgba(255,255,255,0.5)'
                                                }}
                                            >
                                                {fromPlayer.name.substring(0, 2).toUpperCase()}
                                            </Avatar>
                                        )}
                                        <Typography variant="body2" fontWeight="bold">{fromPlayer?.name}</Typography>
                                    </Box>

                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 'bold' }}>Offering</Typography>
                                    {trade.offering.money > 0 && (
                                        <Chip
                                            label={`$${trade.offering.money}`}
                                            color="success"
                                            size="small"
                                            variant="outlined"
                                            icon={<span style={{ marginLeft: 4 }}>💵</span>}
                                            sx={{ justifyContent: 'flex-start', pl: 0.5 }}
                                        />
                                    )}
                                    {trade.offering.properties.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {trade.offering.properties.map(pid => <PropertyCard key={pid} id={pid} />)}
                                        </Box>
                                    ) : (
                                        trade.offering.money === 0 && <Typography variant="caption" color="text.disabled">Nothing</Typography>
                                    )}
                                </Box>

                                {/* Center: Arrow */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                                    <SwapHorizIcon color="action" />
                                </Box>

                                {/* Right: Target (Receives) */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end', textAlign: 'right' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexDirection: 'row-reverse' }}>
                                        {toPlayer && (
                                            <Avatar
                                                sx={{
                                                    width: 24, height: 24, fontSize: '0.75rem',
                                                    bgcolor: getPlayerColor(toPlayer.id),
                                                    border: '1px solid rgba(255,255,255,0.5)'
                                                }}
                                            >
                                                {toPlayer.name.substring(0, 2).toUpperCase()}
                                            </Avatar>
                                        )}
                                        <Typography variant="body2" fontWeight="bold">{toPlayer?.name}</Typography>
                                    </Box>

                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 'bold' }}>Asking For</Typography>
                                    {trade.requesting.money > 0 && (
                                        <Chip
                                            label={`$${trade.requesting.money}`}
                                            color="error"
                                            size="small"
                                            variant="outlined"
                                            icon={<span style={{ marginLeft: 4 }}>💵</span>}
                                            sx={{ justifyContent: 'flex-start', pl: 0.5 }}
                                        />
                                    )}
                                    {trade.requesting.properties.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                                            {trade.requesting.properties.map(pid => <PropertyCard key={pid} id={pid} />)}
                                        </Box>
                                    ) : (
                                        trade.requesting.money === 0 && <Typography variant="caption" color="text.disabled">Nothing</Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Actions */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                {isIncoming && (
                                    <>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            startIcon={<CancelIcon />}
                                            onClick={() => performAction('REJECT_TRADE', trade.id)}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            startIcon={<CheckCircleIcon />}
                                            onClick={() => performAction('ACCEPT_TRADE', trade.id)}
                                        >
                                            Accept Trade
                                        </Button>
                                    </>
                                )}
                                {isOutgoing && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="warning"
                                        onClick={() => performAction('CANCEL_TRADE', trade.id)}
                                    >
                                        Cancel Offer
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
        </Paper>
    );
}
