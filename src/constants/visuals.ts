export const PLAYER_COLORS = [
    '#EF5350', // Red
    '#42A5F5', // Blue
    '#66BB6A', // Green
    '#FFCA28', // Amber/Yellow
    '#AB47BC', // Purple
    '#26C6DA', // Cyan
    '#FF7043', // Deep Orange
    '#8D6E63', // Brown
];

export const getPlayerColor = (index: number) => PLAYER_COLORS[index % PLAYER_COLORS.length];
