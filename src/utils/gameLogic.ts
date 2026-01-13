import { BOARD_CONFIG } from '@/constants/boardConfig';

export const rollDice = (): [number, number] => {
    return [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
    ];
};

export const getNextPosition = (currentPosition: number, diceTotal: number): number => {
    return (currentPosition + diceTotal) % 40;
};

export const didPassGo = (currentPosition: number, nextPosition: number): boolean => {
    // If we wrapped around from 39 to 0+, nextPosition will be smaller than currentPosition
    // (Exception: user could move BACKWARDS via cards, but for standard dice rolls:)
    return nextPosition < currentPosition;
};

export const canBuyProperty = (
    propertyIndex: number,
    playerMoney: number,
    existingOwner: string | null
): boolean => {
    const property = BOARD_CONFIG.find((p) => p.id === propertyIndex);
    if (!property || !property.price || property.group === 'none') {
        return false;
    }
    if (existingOwner) {
        return false;
    }
    return playerMoney >= property.price;
};
