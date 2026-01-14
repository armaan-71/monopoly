'use client';

import { Box } from '@mui/material';
import PropertyTile from './PropertyTile';
import { BOARD_CONFIG } from '@/constants/boardConfig';
import { useGameStore } from '@/store/gameStore';

export default function Board({ children }: { children?: React.ReactNode }) {
    const { players, properties } = useGameStore();

    // Helper to find which players are on a specific tile index
    const getPlayersOnTile = (tileIndex: number) => {
        return players
            .filter((p) => p.position === tileIndex)
            .map((p) => p.avatarId || p.name);
    };

    // Tiles 0-10 (Bottom Row, Right to Left)
    const bottomRow = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    // Tiles 11-19 (Left Column, Bottom to Top)
    const leftCol = [19, 18, 17, 16, 15, 14, 13, 12, 11];
    // Tiles 20-30 (Top Row, Left to Right)
    const topRow = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
    // Tiles 31-39 (Right Column, Top to Bottom)
    const rightCol = [31, 32, 33, 34, 35, 36, 37, 38, 39];

    const renderTile = (index: number) => (
        <Box key={index} sx={{ width: '100%', height: '100%' }}>
            <PropertyTile
                config={BOARD_CONFIG[index]}
                state={properties[index]}
                playersOnTile={getPlayersOnTile(index)}
            />
        </Box>
    );

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(11, 1fr)',
                gridTemplateRows: 'repeat(11, 1fr)',
                gap: 0.5,
                width: '100%',
                maxWidth: '850px',
                aspectRatio: '1/1',
                margin: '0 auto',
                p: 1,
                bgcolor: 'transparent',
            }}
        >
            {/* Top Row (20-30) */}
            {topRow.map((i, idx) => (
                <Box key={i} sx={{ gridColumn: idx + 1, gridRow: 1 }}>
                    {renderTile(i)}
                </Box>
            ))}

            {/* Right Column (31-39) -> gridRow 2 to 10, gridColumn 11 */}
            {rightCol.map((i, idx) => (
                <Box key={i} sx={{ gridColumn: 11, gridRow: idx + 2 }}>
                    {renderTile(i)}
                </Box>
            ))}

            {/* Bottom Row (10-0 in reverse, so 10 is at col 1, 0 is at col 11) */}
            {bottomRow.map((i, idx) => (
                <Box key={i} sx={{ gridColumn: idx + 1, gridRow: 11 }}>
                    {renderTile(i)}
                </Box>
            ))}

            {/* Left Column (19-11 in reverse, so 19 is at row 2, 11 is at row 10) */}
            {leftCol.map((i, idx) => (
                <Box key={i} sx={{ gridColumn: 1, gridRow: idx + 2 }}>
                    {renderTile(i)}
                </Box>
            ))}

            {/* Center Area (Logo + Children) */}
            <Box
                sx={{
                    gridColumn: '2 / span 9',
                    gridRow: '2 / span 9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#1E1E1E', // Darker Card color for center
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Active Controls in Center */}
                <Box sx={{ zIndex: 2, width: '100%', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
