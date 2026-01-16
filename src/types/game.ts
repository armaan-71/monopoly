import { Card } from '@/constants/cards';

export type PlayerId = string;

export interface PlayerState {
    id: PlayerId;
    name: string;
    money: number;
    position: number; // 0-39
    isInJail: boolean;
    jailTurns: number;
    avatarId: string;
    heldCards: Card[];
}

export type PropertyGroup =
    | 'brown'
    | 'lightBlue'
    | 'pink'
    | 'orange'
    | 'red'
    | 'yellow'
    | 'green'
    | 'darkBlue'
    | 'railroad'
    | 'utility'
    | 'special' // Use for things that are truly special but not ownable in the standard way if any, or legacy
    | 'none';   // Chance, Chest, Tax, Go, Jail, Free Parking, Go To Jail

export interface PropertyConfig {
    id: number; // 0-39
    name: string;
    group: PropertyGroup;
    price?: number;
    rent?: number[]; // [base, 1h, 2h, 3h, 4h, hotel]
    houseCost?: number;
    description?: string; // For Chance/Community Chest/Tax
}

export interface PropertyState {
    owner: PlayerId | null;
    houses: number; // 0-4 = houses, 5 = hotel
    isMortgaged: boolean;
}

export interface GameState {
    turnIndex: number;
    players: PlayerState[];
    properties: Record<number, PropertyState>; // Key is board index (0-39)
    lastAction: string;
    log: string[]; // Audit trail of all actions
    dice: [number, number];
    isGameStarted: boolean; // Lobby vs Playing
    winner: PlayerId | null;
    currentCard: Card | null;
}
