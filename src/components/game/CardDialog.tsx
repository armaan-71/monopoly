'use client';

import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    useTheme
} from '@mui/material';
import { useGameStore } from '@/store/gameStore';
import { Card } from '@/constants/cards';

interface CardDialogProps {
    roomId: string; // Passed UUID
    playerId: string | null;
}

export default function CardDialog({ roomId, playerId }: CardDialogProps) {
    const { currentCard } = useGameStore();
    const theme = useTheme();

    if (!currentCard) return null;

    const handleDismiss = async () => {
        if (!playerId) return;
        try {
            await fetch('/api/game/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId,
                    playerId,
                    action: 'DISMISS_CARD'
                })
            });
        } catch (err) {
            console.error(err);
        }
    };

    // Card Styling
    const isChance = currentCard.type === 'CHANCE';
    const bgColor = isChance ? theme.palette.warning.light : theme.palette.info.light;
    const headerColor = isChance ? theme.palette.warning.main : theme.palette.info.main;
    const title = isChance ? 'CHANCE' : 'COMMUNITY CHEST';

    return (
        <Dialog
            open={!!currentCard}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `4px solid ${headerColor}`,
                }
            }}
        >
            <Box sx={{
                bgcolor: headerColor,
                p: 2,
                textAlign: 'center',
                color: theme.palette.getContrastText(headerColor)
            }}>
                <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: 2 }}>
                    {title}
                </Typography>
            </Box>

            <DialogContent sx={{ p: 4, textAlign: 'center', bgcolor: bgColor }}>
                <Typography variant="h6" sx={{ mb: 4, fontWeight: 'medium' }}>
                    {currentCard.text}
                </Typography>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleDismiss}
                    sx={{
                        bgcolor: headerColor,
                        color: theme.palette.getContrastText(headerColor),
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        '&:hover': {
                            bgcolor: isChance ? theme.palette.warning.dark : theme.palette.info.dark
                        }
                    }}
                >
                    OK
                </Button>
            </DialogContent>
        </Dialog>
    );
}
