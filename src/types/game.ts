export type PlayerId = string;

export interface PlayerState {
  id: PlayerId;
  name: string;
  money: number;
  position: number; // 0-39
  isInJail: boolean;
  jailTurns: number;
  color: string; // Hex color for the token
}

export interface PropertyState {
  owner: PlayerId | null;
  houses: number; // 0-4 = houses, 5 = hotel
  isMortgaged: boolean;
}

export interface GameState {
  turnIndex: number; // Index of the player array
  players: PlayerState[];
  properties: Record<number, PropertyState>; // Key is board index (0-39)
  lastAction: string; // "Player 1 bought Boardwalk"
  dice: [number, number];
  communityChestCards: string[]; // Placeholder for now
  chanceCards: string[]; // Placeholder for now
}
