'use client';

import { Box, Paper, Typography, Divider, Avatar, useTheme } from '@mui/material';
import { useGameStore } from '@/store/gameStore';

export default function GameInfoPanel() {
    const { code, players, turnIndex } = useGameStore();
    const theme = useTheme();

    const currentPlayerId = players[turnIndex]?.id;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            {/* Room Info */}
            <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 3 }}>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                    Room Code
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: 'primary.main', letterSpacing: 2 }}>
                    {code}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Share this code to invite friends
                </Typography>
            </Paper>

            {/* Players List */}
            <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 3, flex: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Players
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                    {players.map((p, index) => {
                        const isTurn = index === turnIndex;
                        return (
                            <Box
                                key={p.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: isTurn ? 'rgba(144, 202, 249, 0.08)' : 'transparent',
                                    border: isTurn ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {/* Avatar / Token Placeholder */}
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: isTurn ? 'primary.main' : 'grey.800',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {p.name.charAt(0).toUpperCase()}
                                </Avatar>

                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight={isTurn ? 700 : 400}>
                                        {p.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        ${p.money}
                                    </Typography>
                                </Box>

                                {isTurn && (
                                    <Box sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: 'success.main',
                                        boxShadow: '0 0 8px #66bb6a'
                                    }} />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Paper>

            {/* Chat Placeholder (Future) */}
            <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 3, height: '200px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Live Chat
                </Typography>
                <Box sx={{ flex: 1, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Chat coming soon...
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
