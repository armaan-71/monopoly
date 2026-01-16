'use client';

import { Box, Button, Typography, Paper } from '@mui/material';
import { useGameStore } from '@/store/gameStore';
import { useState, useMemo } from 'react';
import { canBuyProperty } from '@/utils/gameLogic';

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
        log,
        isGameStarted
    } = useGameStore();

    const [loading, setLoading] = useState(false);

    // Derived state
    const currentPlayerIndex = players.findIndex(p => p.id === playerId);
    const isMyTurn = currentPlayerIndex !== -1 && turnIndex === currentPlayerIndex;
    const myPlayer = players[currentPlayerIndex];

    const hasRolled = useMemo(() => {
        if (!isMyTurn) return false;
        if (!lastAction) return false;
        const action = lastAction.toLowerCase();
        return action.includes('rolled') || action.includes('bought') || action.includes('rent') || action.includes('tax') || action.includes('jail') || action.includes('sent') || action.includes('auction') || action.includes('won') || action.includes('bids');
    }, [isMyTurn, lastAction]);

    const canBuy = useMemo(() => {
        if (!isMyTurn || !hasRolled || !myPlayer) return false;
        const pos = myPlayer.position;
        return canBuyProperty(pos, myPlayer.money, properties[pos]?.owner);
    }, [isMyTurn, hasRolled, myPlayer, properties]);

    const handleAction = async (action: 'ROLL_DICE' | 'BUY_PROPERTY' | 'END_TURN' | 'PAY_BAIL' | 'USE_GOJF' | 'DECLINE_BUY') => {
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

    if (!isGameStarted) return <Typography align="center" variant="overline" color="text.secondary">Waiting for game to start...</Typography>;

    if (!myPlayer) return <Typography align="center" variant="overline" color="text.secondary">Spectating</Typography>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: '300px', mx: 'auto' }}>
            <Typography variant="h6" align="center" sx={{ fontWeight: 800, color: isMyTurn ? 'primary.main' : 'text.disabled' }}>
                {isMyTurn ? "YOUR TURN" : `${players[turnIndex]?.name}'s Turn`}
            </Typography>

            {/* Shared Board State Views (Dice + Action) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Paper elevation={0} sx={{ border: '2px solid rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2, minWidth: 50, textAlign: 'center', bgcolor: 'transparent' }}>
                    <Typography variant="h4" fontWeight="bold">{dice[0]}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ border: '2px solid rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2, minWidth: 50, textAlign: 'center', bgcolor: 'transparent' }}>
                    <Typography variant="h4" fontWeight="bold">{dice[1]}</Typography>
                </Paper>
            </Box>

            <Typography variant="body2" align="center" sx={{ color: 'text.secondary', minHeight: '1.5em' }}>
                {lastAction}
            </Typography>

            {/* Controls Layer - Only visible to active player */}
            {isMyTurn && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {!hasRolled && (
                        <>
                            {myPlayer.isInJail ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="caption" align="center" color="error">
                                        You are in Jail!
                                    </Typography>

                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={() => handleAction('ROLL_DICE')}
                                        disabled={loading}
                                    >
                                        Roll Doubles
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="warning"
                                        onClick={() => handleAction('PAY_BAIL')}
                                        disabled={loading || myPlayer.money < 50}
                                    >
                                        Pay Bail ($50)
                                    </Button>

                                    {myPlayer.heldCards?.some(c => c.action === 'JAIL_FREE') && (
                                        <Button
                                            variant="outlined"
                                            color="info"
                                            onClick={() => handleAction('USE_GOJF')}
                                            disabled={loading}
                                        >
                                            Use GOJF Card
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => handleAction('ROLL_DICE')}
                                    disabled={loading}
                                    sx={{ boxShadow: 'none', py: 1.5 }}
                                >
                                    Roll Dice
                                </Button>
                            )}
                        </>
                    )}

                    {hasRolled && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: canBuy ? '1fr 1fr' : '1fr', gap: 1.5 }}>
                            {canBuy && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => handleAction('BUY_PROPERTY')}
                                        disabled={loading}
                                        sx={{ flex: 1 }}
                                    >
                                        Buy
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        size="large"
                                        onClick={() => handleAction('DECLINE_BUY')}
                                        disabled={loading}
                                        sx={{ flex: 1 }}
                                    >
                                        Auction
                                    </Button>
                                </Box>
                            )}
                            <Button
                                variant="contained"
                                color="error"
                                size="large"
                                onClick={() => handleAction('END_TURN')}
                                disabled={loading}
                                sx={{ boxShadow: 'none' }}
                            >
                                End Turn
                            </Button>
                        </Box>
                    )}
                </Box>
            )}

            {/* Audit Trail / Game Log - Visible to EVERYONE always */}
            <Box sx={{
                mt: 2,
                width: '100%',
                maxHeight: '150px',
                overflowY: 'auto',
                bgcolor: 'rgba(0,0,0,0.2)',
                borderRadius: 2,
                p: 1.5,
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column-reverse'
            }}>
                {(log || []).slice().reverse().map((entry, i) => (
                    <Typography key={i} variant="caption" display="block" color="text.secondary" sx={{ py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {entry}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
}
