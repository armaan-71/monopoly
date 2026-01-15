import { GameState, PlayerId } from "@/types/game";
import { create } from "zustand";

interface GameStore extends GameState {
  setGameState: (state: Partial<GameState>) => void;
  // Actions
  movePlayer: (playerId: PlayerId, steps: number) => void;
  buyProperty: (playerId: PlayerId, propertyIndex: number) => void;
  endTurn: () => void;
}

const INITIAL_STATE: GameState = {
  turnIndex: 0,
  players: [
    {
      id: "1",
      name: "Player 1",
      money: 1500,
      position: 0,
      isInJail: false,
      jailTurns: 0,
      color: "#FF0000",
    },
    {
      id: "2",
      name: "Player 2",
      money: 1500,
      position: 0,
      isInJail: false,
      jailTurns: 0,
      color: "#0000FF",
    },
  ],
  properties: {},
  lastAction: "Game Started",
  dice: [1, 1],
  communityChestCards: [],
  chanceCards: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...INITIAL_STATE,
  setGameState: (state) => set((prev) => ({ ...prev, ...state })),
  movePlayer: (playerId, steps) =>
    set((state) => {
      const players = state.players.map((p) => {
        if (p.id !== playerId) return p;
        const newPos = (p.position + steps) % 40;
        // Handle passing GO logic here if needed (e.g. +$200)
        return { ...p, position: newPos };
      });
      return { players };
    }),
  buyProperty: (playerId, propertyIndex) =>
    set((state) => {
      // Basic logic - moved validation to utils/components
      return {
        properties: {
          ...state.properties,
          [propertyIndex]: { owner: playerId, houses: 0, isMortgaged: false },
        },
      };
    }),
  endTurn: () =>
    set((state) => ({
      turnIndex: (state.turnIndex + 1) % state.players.length,
    })),
}));
