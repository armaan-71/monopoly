'use client';

import { useEffect, useState, use } from 'react';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';
import Board from '@/components/board/Board';
import GameControls from '@/components/game/GameControls';
import { useRealtimeGame } from '@/hooks/useRealtimeGame';
import { useGameStore } from '@/store/gameStore';

export default function GameRoom({ params }: { params: Promise<{ id: string }> }) {
    const { id: roomId } = use(params);
    useRealtimeGame(roomId);

    const { code, players } = useGameStore();
    const [playerId, setPlayerId] = useState<string>('');

    useEffect(() => {
        // Restore identity from local storage
        const stored = localStorage.getItem(`monopoly_player_${roomId}`);
        if (stored) setPlayerId(stored);
    }, [roomId]);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
            <Container maxWidth="xl">
                {/* Responsive Grid Layout using Box and CSS Grid */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '300px 1fr 300px' },
                    gap: 4
                }}>

                    {/* Left Panel: Game State / Players */}
                    <Box>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h6">Room Code: {code || 'Loading...'}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Share this code with friends
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Players</Typography>
                                {players.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">No players yet</Typography>
                                ) : (
                                    players.map(p => (
                                        <Box key={p.id} sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            p: 1,
                                            bgcolor: p.id === playerId ? 'action.selected' : 'transparent',
                                            borderRadius: 1
                                        }}>
                                            <Typography fontWeight={p.id === playerId ? 'bold' : 'normal'}>
                                                {p.name} {p.id === playerId && '(You)'}
                                            </Typography>
                                            <Typography color="success.main">${p.money}</Typography>
                                        </Box>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Center: The Board */}
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Board />
                    </Box>

                    {/* Right Panel: Controls */}
                    <Box>
                        <GameControls roomId={roomId} playerId={playerId} />
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
