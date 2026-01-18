import { useState } from 'react';
import {
    Box, Typography, Paper, Chip,
    Dialog, DialogTitle, DialogContent,
    Grid, Button, useTheme, IconButton, Tooltip
} from '@mui/material';
import { useGameStore } from '@/store/gameStore';
import { BOARD_CONFIG } from '@/constants/boardConfig';
import { PropertyGroup } from '@/types/game';
import HandshakeIcon from '@mui/icons-material/Handshake';
import TradeModal from './TradeModal';
import ActiveTradesList from './ActiveTradesList';

export default function PropertyDashboard({ playerId, roomId, onPropertyClick }: { playerId: string; roomId: string; onPropertyClick?: (id: number) => void }) {
    const theme = useTheme();
    const { players, properties, code } = useGameStore();
    const [tradeOpen, setTradeOpen] = useState(false);

    const me = players.find(p => p.id === playerId);
    // Find all properties owned by me
    const myProperties = BOARD_CONFIG.filter(config => {
        const state = properties[config.id];
        return state && state.owner === playerId;
    });

    const getPropertyState = (id: number) => properties[id];

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
            default: return theme.palette.divider; // Fallback for stations/utilities
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TradeModal open={tradeOpen} onClose={() => setTradeOpen(false)} playerId={playerId} roomId={roomId} />

            {/* Permanent Quit/Bankruptcy Option */}
            <Paper sx={{ p: 2, bgcolor: theme.palette.background.paper }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        startIcon={<HandshakeIcon />}
                        onClick={() => setTradeOpen(true)}
                        disabled={!me || me.isBankrupt}
                        sx={{ fontWeight: 'bold' }}
                    >
                        Trade
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={async () => {
                            const isDebt = (me?.money || 0) < 0;
                            const msg = isDebt
                                ? "Declare Bankruptcy? This will surrender all assets and remove you from the game."
                                : "Quit Game? This will surrender your assets and remove you from the game.";

                            if (!confirm(msg)) return;

                            await fetch('/api/game/action', {
                                method: 'POST',
                                body: JSON.stringify({ roomId, playerId, action: 'DECLARE_BANKRUPTCY' })
                            });
                        }}
                        sx={{ minWidth: 50, px: 1 }}
                    >
                        ⚠
                    </Button>
                </Box>
                {me && me.money < 0 && (
                    <Typography variant="caption" color="error" align="center" display="block" sx={{ mt: 1, fontWeight: 'bold' }}>
                        You are in debt! You must resolve this or quit.
                    </Typography>
                )}
            </Paper>

            <ActiveTradesList playerId={playerId} roomId={roomId} />

            <Paper sx={{ p: 2, minHeight: '300px' }}>
                <Typography variant="h6" gutterBottom>
                    Your Portfolio
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Empty State */}
                    {myProperties.length === 0 && (!me?.heldCards || me.heldCards.length === 0) && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No assets owned yet.
                        </Typography>
                    )}

                    {/* Held Cards */}
                    {me?.heldCards?.map((card, i) => (
                        <Box
                            key={`card-${i}`}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'rgba(255,165,0,0.15)', // Orange tint
                                borderLeft: `6px solid ${theme.palette.warning.main}`,
                            }}
                        >
                            <Box sx={{ flex: 1, pl: 1 }}>
                                <Typography variant="body1" fontWeight="500">
                                    Get Out of Jail Free
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Keep or Use
                                </Typography>
                            </Box>
                            <Chip label="SPECIAL" color="warning" size="small" variant="outlined" />
                        </Box>
                    ))}

                    {/* Properties */}
                    {myProperties.map(prop => {
                        const state = getPropertyState(prop.id);
                        const isMortgaged = state?.isMortgaged;
                        const color = getGroupColor(prop.group);

                        return (
                            <Box
                                key={prop.id}
                                onClick={() => onPropertyClick?.(prop.id)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    borderLeft: `6px solid ${color}`,
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                <Box sx={{ flex: 1, pl: 1 }}>
                                    <Typography variant="body1" fontWeight="500">
                                        {prop.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {prop.group === 'special' ? 'Special' : `Rent: $${prop.rent?.[state?.houses || 0] || 0}`}
                                    </Typography>
                                </Box>
                                {isMortgaged && (
                                    <Chip label="MORTGAGED" color="error" size="small" variant="outlined" />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Paper>
        </Box>
    );
}
