'use client';

import { useEffect, useState, use } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import Board from '@/components/board/Board';
import GameControls from '@/components/game/GameControls';
import PropertyDashboard from '@/components/game/PropertyDashboard';
import GameInfoPanel from '@/components/game/GameInfoPanel';
import PropertyDetailsDialog from '@/components/game/PropertyDetailsDialog';
import CardDialog from '@/components/game/CardDialog';
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

    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

    const handlePropertyClick = (propertyId: number) => {
        setSelectedPropertyId(propertyId);
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
            p: { xs: 1, md: 2 },
        }}>
            <PropertyDetailsDialog
                open={selectedPropertyId !== null}
                onClose={() => setSelectedPropertyId(null)}
                propertyId={selectedPropertyId}
                playerId={playerId}
                roomId={roomId}
            />

            <CardDialog roomId={roomId} playerId={playerId} />

            <Container maxWidth="xl" disableGutters sx={{ height: '100%' }}>

                {/* Main 3-Column Layout */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '320px 1fr 320px' },
                    gap: 3,
                    alignItems: 'start',
                }}>

                    {/* Left Panel: Game Info, Players, Chat - Sticky Sidebar */}
                    <Box sx={{
                        order: { xs: 2, lg: 1 },
                        position: { lg: 'sticky' },
                        top: 24,
                        height: { lg: 'calc(100vh - 48px)' },
                        overflowY: 'auto' // Internal scroll if needed
                    }}>
                        <GameInfoPanel playerId={playerId} />
                    </Box>

                    {/* Center: The Board with Controls */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        order: { xs: 1, lg: 2 },
                        position: 'relative'
                    }}>
                        <Board onPropertyClick={handlePropertyClick}>
                            <GameControls roomId={roomId} playerId={playerId} />

                            {/* Start Game Button (MVP) inside Board */}
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
                                        Current Status: Lobby
                                    </Typography>
                                </Box>
                            )}
                        </Board>
                    </Box>

                    {/* Right Panel: My Properties - Sticky Sidebar */}
                    <Box sx={{
                        order: { xs: 3, lg: 3 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        position: { lg: 'sticky' },
                        top: 24,
                        height: { lg: 'calc(100vh - 48px)' },
                        overflowY: 'auto' // Internal scroll if needed
                    }}>
                        {/* My Dashboard (Cash + Properties) */}
                        <PropertyDashboard playerId={playerId} onPropertyClick={handlePropertyClick} />
                    </Box>

                </Box>
            </Container>
        </Box>
    );
}
