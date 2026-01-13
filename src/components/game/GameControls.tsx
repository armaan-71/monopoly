'use client';

import { Box, Button, Typography, Paper } from '@mui/material';
import { useGameStore } from '@/store/gameStore';
import { useState } from 'react';
import { didPassGo, canBuyProperty } from '@/utils/gameLogic'; // Helper import if needed, but logic is mostly server-side or duplicate
// We'll trust the server response, but can use helpers for UI state enabling/disabling

interface GameControlsProps {
    roomId: string;
    playerId: string;
}

export default function GameControls({ roomId, playerId }: GameControlsProps) {
    const {
        turnIndex,
        players,
        properties,
        dice,
        lastAction,
        isGameStarted
    } = useGameStore();

    const [loading, setLoading] = useState(false);

    // Derived state
    const currentPlayerIndex = players.findIndex(p => p.id === playerId);
    const isMyTurn = currentPlayerIndex !== -1 && turnIndex === currentPlayerIndex;
    const myPlayer = players[currentPlayerIndex];

    const handleAction = async (action: 'ROLL_DICE' | 'BUY_PROPERTY' | 'END_TURN') => {
        if (!roomId || !playerId) return;
        setLoading(true);

        try {
            await fetch('/api/game/action', {
                method: 'POST',
                body: JSON.stringify({
                    roomId,
                    playerId,
                    action,
                }),
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isGameStarted) {
        return (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography>Waiting for game to start...</Typography>
            </Paper>
        );
    }

    if (!myPlayer) {
        return (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography>Spectating</Typography>
            </Paper>
        );
    }

    // Determine which buttons to show
    // (Simplified state machine for MVP: If turn just started, show Roll. If rolled, show Buy/End.)
    // We can track "hasRolled" in local component state if we reset it on turn change, 
    // or store it in DB. For MVP, we'll just allow actions if it's my turn. 
    // A robust implementation would store `phase` in GameState (e.g. 'ROLLING', 'TRADING', 'ENDING')

    return (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" align="center">
                {isMyTurn ? "IT'S YOUR TURN" : `Waiting for ${players[turnIndex]?.name}...`}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Box sx={{ border: '2px solid #333', p: 2, borderRadius: 2 }}>
                    {dice[0]}
                </Box>
                <Box sx={{ border: '2px solid #333', p: 2, borderRadius: 2 }}>
                    {dice[1]}
                </Box>
            </Box>

            <Typography variant="body2" align="center" color="text.secondary">
                {lastAction}
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Button
                    variant="contained"
                    onClick={() => handleAction('ROLL_DICE')}
                    disabled={!isMyTurn || loading}
                >
                    Roll Dice
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => handleAction('BUY_PROPERTY')}
                    disabled={!isMyTurn || loading}
                >
                    Buy Property
                </Button>
                <Button
                    variant="contained"
                    color="warning"
                    onClick={() => handleAction('END_TURN')}
                    disabled={!isMyTurn || loading}
                    sx={{ gridColumn: '1 / -1' }}
                >
                    End Turn
                </Button>
            </Box>

            <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
                <Typography variant="subtitle2">My Stats</Typography>
                <Typography>Cash: ${myPlayer.money}</Typography>
                <Typography>Position: {myPlayer.position}</Typography>
            </Box>
        </Paper>
    );
}
