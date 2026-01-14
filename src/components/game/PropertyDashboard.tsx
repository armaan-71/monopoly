'use client';

import { useState } from 'react';
import {
    Box, Typography, Paper, Chip,
    Dialog, DialogTitle, DialogContent,
    Grid, Button, useTheme
} from '@mui/material';
import { useGameStore } from '@/store/gameStore';
import { BOARD_CONFIG } from '@/constants/boardConfig';
import { PropertyGroup } from '@/types/game';

export default function PropertyDashboard({ playerId }: { playerId: string }) {
    const theme = useTheme();
    const { players, properties, code } = useGameStore();
    const [selectedPropId, setSelectedPropId] = useState<number | null>(null);

    const me = players.find(p => p.id === playerId);
    // Find all properties owned by me
    const myProperties = BOARD_CONFIG.filter(config => {
        const state = properties[config.id];
        return state && state.owner === playerId;
    });

    const handleOpen = (id: number) => setSelectedPropId(id);
    const handleClose = () => setSelectedPropId(null);

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
            <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="overline" color="text.secondary">
                    Room Code: {code}
                </Typography>
                <Box sx={{ mt: 1 }}>
                    {/* Minimal Player Stats Header */}
                    <Typography variant="h4" fontWeight="bold">
                        ${me?.money || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {me?.name} (You)
                    </Typography>
                </Box>
            </Paper>

            <Paper sx={{ p: 2, minHeight: '300px' }}>
                <Typography variant="h6" gutterBottom>
                    Your Portfolio
                </Typography>

                {myProperties.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No properties owned yet.
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {myProperties.map(prop => {
                            const state = getPropertyState(prop.id);
                            const isMortgaged = state?.isMortgaged;
                            const color = getGroupColor(prop.group);

                            return (
                                <Box
                                    key={prop.id}
                                    onClick={() => handleOpen(prop.id)}
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
                )}
            </Paper>

            {/* Rent Card / Mortgage Dialog */}
            <Dialog open={selectedPropId !== null} onClose={handleClose} fullWidth maxWidth="xs">
                {selectedPropId !== null && (() => {
                    const prop = BOARD_CONFIG.find(p => p.id === selectedPropId);
                    if (!prop) return null;
                    const state = getPropertyState(selectedPropId);
                    const isMortgaged = state?.isMortgaged;
                    const color = getGroupColor(prop.group);

                    return (
                        <>
                            <DialogTitle sx={{ bgcolor: color, color: '#fff', textAlign: 'center', py: 3 }}>
                                {prop.name} ({prop.id})
                            </DialogTitle>
                            <DialogContent sx={{ pt: 3 }}>
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Typography variant="body2" color="text.secondary">Running Rent</Typography>
                                    <Typography variant="h4" fontWeight="bold">
                                        ${isMortgaged ? 0 : (prop.group === 'special' ? 'Dice x N' : (prop.rent?.[state?.houses || 0] || 'Unknown'))}
                                    </Typography>
                                </Box>

                                {/* Future Mortgage Actions Here */}
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button fullWidth variant="outlined" color="warning" disabled>
                                        Mortgage (Coming soon)
                                    </Button>
                                </Box>
                            </DialogContent>
                        </>
                    );
                })()}
            </Dialog>
        </Box>
    );
}
