import { BOARD_CONFIG } from '@/constants/boardConfig';
import { PropertyState, GameState, PlayerState } from '@/types/game';

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

export const calculateRent = (
    propertyIndex: number,
    gameState: GameState,
    diceTotal: number
): number => {
    const propertyDef = BOARD_CONFIG.find(p => p.id === propertyIndex);
    const propertyState = gameState.properties[propertyIndex];

    if (!propertyDef || !propertyState || !propertyState.owner || propertyState.isMortgaged) {
        return 0;
    }

    // Utilities (Electric Company, Water Works)
    // Rule: 4x dice if one owned, 10x if both owned
    if (propertyDef.group === 'special' && (propertyDef.name.includes('Electric') || propertyDef.name.includes('Water'))) {
        const utilityIds = [12, 28]; // Electric Company, Water Works
        const owner = propertyState.owner;
        const ownedCount = utilityIds.filter(id => gameState.properties[id]?.owner === owner).length;

        return ownedCount === 2 ? diceTotal * 10 : diceTotal * 4;
    }

    // Railroads
    // Rule: $25, $50, $100, $200 based on number owned
    if (propertyDef.group === 'special' && propertyDef.name.includes('Railroad')) {
        const rrIds = [5, 15, 25, 35];
        const owner = propertyState.owner;
        const ownedCount = rrIds.filter(id => gameState.properties[id]?.owner === owner).length;
        return 25 * Math.pow(2, ownedCount - 1);
    }

    // Standard Properties (Colors)
    if (propertyDef.rent) {
        const houses = propertyState.houses || 0;
        return propertyDef.rent[houses];
    }

    return 0;
};

export const handleSpecialTile = (
    player: PlayerState,
    position: number
): { moneyChange: number, sendToJail: boolean, message?: string } => {
    const tile = BOARD_CONFIG.find(p => p.id === position);
    if (!tile) return { moneyChange: 0, sendToJail: false };

    // Income Tax: Pay $200
    if (tile.name === 'Income Tax') {
        return { moneyChange: -200, sendToJail: false, message: 'Paid $200 Income Tax' };
    }

    // Luxury Tax: Pay $100
    if (tile.name === 'Luxury Tax') {
        return { moneyChange: -100, sendToJail: false, message: 'Paid $100 Luxury Tax' };
    }

    // Go To Jail
    if (tile.name === 'Go To Jail') {
        return { moneyChange: 0, sendToJail: true, message: 'Sent to Jail!' };
    }

    return { moneyChange: 0, sendToJail: false };
};
