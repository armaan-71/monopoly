'use client';

import { Paper, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PropertyConfig, PropertyState, PropertyGroup } from '@/types/game';

interface PropertyTileProps {
    config: PropertyConfig;
    state?: PropertyState;
    playersOnTile?: string[]; // array of avatarIds or names
}

export default function PropertyTile({
    config,
    state,
    playersOnTile = [],
}: PropertyTileProps) {
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

    return (
        <Paper
            elevation={3}
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: `1px solid ${theme.palette.grey[400]}`,
                overflow: 'hidden',
                bgcolor: 'background.paper',
            }}
        >
            {/* Color Header */}
            {!isSpecial && (
                <Box
                    sx={{
                        height: '25%',
                        bgcolor: headerColor,
                        borderBottom: `1px solid ${theme.palette.grey[800]}`,
                    }}
                />
            )}

            {/* Content */}
            <Box sx={{
                flexGrow: 1,
                p: 0.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: isSpecial ? 'center' : 'flex-start',
                textAlign: 'center'
            }}>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', lineHeight: 1.1, fontWeight: 'bold' }}>
                    {config.name}
                </Typography>

                {/* Price or Icon could go here */}
                {config.price && (
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', mt: 0.5 }}>
                        ${config.price}
                    </Typography>
                )}
            </Box>

            {/* Houses / Hotels Indicator */}
            {houseCount > 0 && (
                <Box sx={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 0.5 }}>
                    {Array.from({ length: houseCount }).map((_, i) => (
                        <Box
                            key={i}
                            sx={{
                                width: 6,
                                height: 6,
                                bgcolor: houseCount === 5 ? 'red' : 'green', // Hotel vs House
                                borderRadius: '50%'
                            }}
                        />
                    ))}
                </Box>
            )}

            {/* Players on Tile */}
            {playersOnTile.length > 0 && (
                <Box sx={{
                    position: 'absolute',
                    bottom: 2,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: 0.5
                }}>
                    {playersOnTile.map((avatarId, i) => (
                        <Box
                            key={i}
                            sx={{
                                width: 12,
                                height: 12,
                                bgcolor: theme.palette.secondary.main,
                                borderRadius: '50%',
                                border: '1px solid white',
                            }}
                            title={avatarId}
                        />
                    ))}
                </Box>
            )}
        </Paper>
    );
}
