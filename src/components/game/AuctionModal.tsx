import { Box, Button, Dialog, DialogContent, DialogTitle, Typography, LinearProgress } from '@mui/material';
import { useGameStore } from '@/store/gameStore';
import { BOARD_CONFIG } from '@/constants/boardConfig';
import PropertyTile from '@/components/board/PropertyTile';
import { useMemo, useEffect, useState } from 'react';

interface AuctionModalProps {
    roomId: string;
    playerId: string;
}

export default function AuctionModal({ roomId, playerId }: AuctionModalProps) {
    const { auction, players } = useGameStore();

    // Derived state
    const isOpen = !!auction && auction.status === 'active';
    const endTime = auction?.endTime || 0;

    // Timer State
    const [timeLeft, setTimeLeft] = useState(0);

    // Sync timer
    useEffect(() => {
        if (!isOpen || !endTime) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            setTimeLeft(remaining);

            if (remaining <= 0) {
                // Trigger resolve? 
                // To avoid spamming, maybe only trigger if we think we should?
                // Let's just create a wrapper function that checks if we already triggered it
                // Actually, multiple clients might trigger it. Server handles idempotency/validation.
                // We can just trigger it once when it hits 0.
                performAction('RESOLVE_AUCTION');
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isOpen, endTime]);


    const property = useMemo(() =>
        auction ? BOARD_CONFIG.find(p => p.id === auction.propertyId) : null,
        [auction]);

    if (!auction || !property) return null;

    const highestBid = auction.highestBid;
    const leaderId = auction.highestBidder;
    const leaderName = players.find(p => p.id === leaderId)?.name || 'None';

    // Am I in the auction?
    const isActiveParticipant = auction.activeBidders.includes(playerId || '');
    const isLeader = leaderId === playerId;
    const myMoney = players.find(p => p.id === playerId)?.money || 0;

    const performAction = async (action: string, payload: any = {}) => {
        if (!roomId || !playerId) return;
        try {
            await fetch('/api/game/action', {
                method: 'POST',
                body: JSON.stringify({
                    roomId,
                    playerId,
                    action,
                    ...payload
                }),
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleBid = (increment: number) => {
        const amount = highestBid + increment;
        if (amount <= myMoney) {
            performAction('PLACE_BID', { amount });
        }
    };

    const handleFold = () => {
        performAction('FOLD_AUCTION');
    };

    // Progress (0 to 100). If 10s total, value is (remaining / 10000) * 100
    // But since it resets to 10s, we just map 0-10000 -> 0-100
    const progress = Math.min(100, (timeLeft / 10000) * 100);

    return (
        <Dialog
            open={isOpen}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#1E1E1E',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 3
                }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                🚨 AUCTION IN PROGRESS 🚨
            </DialogTitle>

            {/* Timer Bar */}
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    height: 8,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                        bgcolor: progress < 30 ? 'error.main' : 'primary.main',
                        transition: 'none' // Smooth out the ticks? or direct updates
                    }
                }}
            />

            <DialogContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>

                    {/* Property Card Preview */}
                    <Box sx={{ width: 160, height: 200, flexShrink: 0 }}>
                        <PropertyTile config={property} />
                    </Box>

                    {/* Status & Controls */}
                    <Box sx={{ flexGrow: 1, width: '100%', textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'grey.400', mb: 1 }}>
                            Current Bid
                        </Typography>
                        <Typography variant="h3" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 1 }}>
                            ${highestBid}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'grey.500', mb: 1 }}>
                            Time Left: {(timeLeft / 1000).toFixed(1)}s
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 4 }}>
                            Leader: <span style={{ color: 'white', fontWeight: 'bold' }}>{leaderName}</span>
                        </Typography>

                        {/* Controls */}
                        {isActiveParticipant ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    {[10, 50, 100].map((inc) => (
                                        <Button
                                            key={inc}
                                            variant="contained"
                                            color="success"
                                            disabled={isLeader || (highestBid + inc) > myMoney}
                                            onClick={() => handleBid(inc)}
                                            sx={{ flex: 1 }}
                                        >
                                            +${inc}
                                        </Button>
                                    ))}
                                </Box>

                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleFold}
                                    disabled={isLeader} // Cannot fold if winning
                                    sx={{ mt: 1 }}
                                >
                                    {isLeader ? 'You are winning!' : 'Fold (Exit Auction)'}
                                </Button>
                            </Box>
                        ) : (
                            <Typography color="error" variant="body1" sx={{ fontStyle: 'italic' }}>
                                You have folded.
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Active Bidders List */}
                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="caption" sx={{ color: 'grey.500' }}>
                        Active Bidders: {auction.activeBidders.length}
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
