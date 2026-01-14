'use client';

import { useEffect, useState, use } from 'react';
import { Box, Container, Typography } from '@mui/material';
import Board from '@/components/board/Board';
import GameControls from '@/components/game/GameControls';
import PropertyDashboard from '@/components/game/PropertyDashboard';
import { useRealtimeGame } from '@/hooks/useRealtimeGame';
import { useGameStore } from '@/store/gameStore';

export default function GameRoom({ params }: { params: Promise<{ id: string }> }) {
    const { id: roomId } = use(params);
    useRealtimeGame(roomId);

    const { isGameStarted, players } = useGameStore();
    const [playerId, setPlayerId] = useState<string>('');

    useEffect(() => {
        // Restore identity from local storage
        const stored = localStorage.getItem(`monopoly_player_${roomId}`);
        if (stored) setPlayerId(stored);
    }, [roomId]);

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
            p: { xs: 1, md: 3 }
        }}>
            <Container maxWidth="xl" disableGutters>

                {/* Main 3-Column Layout */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '350px 1fr 350px' },
                    gap: 4,
                    alignItems: 'start'
                }}>

                    {/* Left Panel: Personal Dashboard */}
                    <Box sx={{ order: { xs: 2, lg: 1 } }}>
                        <PropertyDashboard playerId={playerId} />
                    </Box>

                    {/* Center: The Board */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        order: { xs: 1, lg: 2 }
                    }}>
                        <Board />
                    </Box>

                    {/* Right Panel: Game Controls & Global Log */}
                    <Box sx={{ order: { xs: 3, lg: 3 } }}>
                        <GameControls roomId={roomId} playerId={playerId} />

                        {/* Start Game Button (MVP) */}
                        {!isGameStarted && players.length > 0 && (
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <button
                                    onClick={async () => {
                                        await fetch('/api/game/start', {
                                            method: 'POST',
                                            body: JSON.stringify({ roomId })
                                        });
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        background: '#2e7d32',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    START GAME
                                </button>
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                    Waiting for players...
                                </Typography>
                            </Box>
                        )}
                    </Box>

                </Box>
            </Container>
        </Box>
    );
}
