'use client';

import { Paper, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PropertyConfig, PropertyState, PropertyGroup } from '@/types/game';
import { getPlayerColor } from '@/constants/visuals';

interface PropertyTileProps {
    config: PropertyConfig;
    state?: PropertyState;
    playersOnTile?: string[]; // array of avatarIds or names
}

export default function PropertyTile({
    config,
    state,
    playersOnTile = [],
    ownerIndex = -1,
    ownerName,
}: {
    config: PropertyConfig;
    state?: PropertyState;
    playersOnTile?: Array<{ name: string; index: number }>;
    ownerIndex?: number;
    ownerName?: string;
}) {
    const theme = useTheme();

    // Helper to get color from theme
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
            default: return theme.palette.grey[300];
        }
    };

    const isSpecial = config.group === 'none' || config.group === 'special';
    const headerColor = getGroupColor(config.group);
    const houseCount = state?.houses || 0;
    const isMortgaged = state?.isMortgaged;

    const ownerColor = ownerIndex >= 0 ? getPlayerColor(ownerIndex) : null;
    const ownerInitials = ownerName ? ownerName.substring(0, 2).toUpperCase() : '';

    return (
        <Paper
            elevation={3}
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: `1px solid ${theme.palette.grey[400]}`, // Revert to standard border
                overflow: 'hidden',
                bgcolor: 'background.paper',
                opacity: isMortgaged ? 0.6 : 1,
                transition: 'transform 0.1s, box-shadow 0.1s',
                '&:hover': {
                    transform: 'scale(1.05)',
                    zIndex: 20,
                    boxShadow: 6
                },
            }}
        >
            {/* Ownership Initials - Corner Indicator */}
            {ownerColor && ownerInitials && !isMortgaged && (
                <Typography
                    sx={{
                        position: 'absolute',
                        bottom: 2,
                        right: 4,
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        color: ownerColor,
                        zIndex: 1,
                        opacity: 0.9,
                        letterSpacing: -0.5
                    }}
                >
                    {ownerInitials}
                </Typography>
            )}
            {/* Color Header */}
            {!isSpecial && (
                <Box
                    sx={{
                        height: '25%',
                        bgcolor: headerColor,
                        borderBottom: `1px solid ${theme.palette.grey[800]}`,
                        filter: isMortgaged ? 'grayscale(100%)' : 'none',
                        position: 'relative'
                    }}
                >
                    {isMortgaged && (
                        <Box sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(0,0,0,0.3)'
                        }}>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.5rem', letterSpacing: 1 }}>
                                MORTGAGED
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Content */}
            <Box sx={{
                flexGrow: 1,
                p: 0.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: isSpecial ? 'center' : 'flex-start',
                textAlign: 'center',
                position: 'relative'
            }}>
                {/* Mortgaged Hatch Pattern Overlay for the body */}
                {isMortgaged && (
                    <Box sx={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.1,
                        backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)'
                    }} />
                )}

                <Typography variant="caption" sx={{ fontSize: '0.65rem', lineHeight: 1.1, fontWeight: 'bold', zIndex: 1 }}>
                    {config.name}
                </Typography>

                {/* Price */}
                {config.price && !isMortgaged && (
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', mt: 0.5, opacity: 0.7 }}>
                        ${config.price}
                    </Typography>
                )}
            </Box>

            {/* Houses / Hotels Indicator */}
            {houseCount > 0 && !isMortgaged && (
                <Box sx={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 0.5, zIndex: 2 }}>
                    {Array.from({ length: houseCount }).map((_, i) => (
                        <Box
                            key={i}
                            sx={{
                                width: 6,
                                height: 6,
                                bgcolor: houseCount === 5 ? 'red' : 'green', // Hotel vs House
                                borderRadius: '50%',
                                border: '1px solid white'
                            }}
                        />
                    ))}
                </Box>
            )}

            {/* Players on Tile (Avatars) */}
            {playersOnTile.length > 0 && (
                <Box sx={{
                    position: 'absolute',
                    bottom: 2,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    padding: '0 2px',
                    gap: 0.5,
                    zIndex: 5
                }}>
                    {playersOnTile.map((p, i) => {
                        const pColor = getPlayerColor(p.index);
                        const initials = p.name.substring(0, 2).toUpperCase();
                        return (
                            <Box
                                key={i}
                                sx={{
                                    width: 18,
                                    height: 18,
                                    bgcolor: pColor,
                                    borderRadius: '50%',
                                    border: '1.5px solid white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '0.5rem',
                                    fontWeight: 'bold',
                                    boxShadow: 2
                                }}
                                title={p.name}
                            >
                                {initials}
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Paper>
    );
}
