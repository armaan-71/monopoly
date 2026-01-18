export const getGridPosition = (index: number) => {
    // Grid matches Board.tsx: 11x11
    // Bottom Row: 10->0 (Row 11, Cols 1->11)
    // Left Col: 19->11 (Row 2->10, Col 1)
    // Top Row: 20->30 (Row 1, Cols 1->11)
    // Right Col: 31->39 (Row 2->10, Col 11)

    let row = 1;
    let col = 1;

    if (index >= 0 && index <= 10) {
        // Bottom Row
        row = 11;
        // Index 10 is Col 1, Index 0 is Col 11
        // Col = 11 - index
        col = 11 - index;
    } else if (index >= 11 && index <= 19) {
        // Left Column
        col = 1;
        // Index 11 is Row 10, Index 19 is Row 2
        // Row = 10 - (index - 11) = 21 - index
        row = 21 - index;
    } else if (index >= 20 && index <= 30) {
        // Top Row
        row = 1;
        // Index 20 is Col 1, Index 30 is Col 11
        // Col = index - 19
        col = index - 19;
    } else if (index >= 31 && index <= 39) {
        // Right Column
        col = 11;
        // Index 31 is Row 2, Index 39 is Row 10
        // Row = index - 29
        row = index - 29;
    }

    return { gridColumn: col, gridRow: row };
};

export const getPlayerColor = (index: number) => {
    const colors = ['#f44336', '#2196f3', '#4caf50', '#ffeb3b', '#9c27b0', '#ff9800'];
    return colors[index % colors.length];
};
