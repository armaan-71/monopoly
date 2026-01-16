import { create } from 'zustand';
import { GameState, PlayerState, PropertyState } from '@/types/game';
import { devtools } from 'zustand/middleware';

interface GameStore extends GameState {
    code: string | null;
    // Actions
    setGameState: (state: Partial<GameState>) => void;
    setRoomCode: (code: string) => void;
    updatePlayer: (playerId: string, updates: Partial<PlayerState>) => void;
    updateProperty: (propertyIndex: number, updates: Partial<PropertyState>) => void;
    resetGame: () => void;
}

const INITIAL_STATE: Omit<GameStore, 'setGameState' | 'setRoomCode' | 'updatePlayer' | 'updateProperty' | 'resetGame'> = {
    code: null,
    turnIndex: 0,
    players: [],
    properties: {},
    lastAction: 'Game initialized',
    log: ['Game initialized'],
    dice: [1, 1],
    isGameStarted: false,
    winner: null,
    currentCard: null,
    auction: null,
    hasRolled: false,
};

export const useGameStore = create<GameStore>()(
    devtools((set) => ({
        ...INITIAL_STATE,

        setGameState: (newState) => set((state) => ({ ...state, ...newState })),

        setRoomCode: (code) => set({ code }),

        updatePlayer: (playerId, updates) =>
            set((state) => ({
                players: state.players.map((p) =>
                    p.id === playerId ? { ...p, ...updates } : p
                ),
            })),

        updateProperty: (propertyIndex, updates) =>
            set((state) => ({
                properties: {
                    ...state.properties,
                    [propertyIndex]: {
                        ...(state.properties[propertyIndex] || {
                            owner: null,
                            houses: 0,
                            isMortgaged: false,
                        }),
                        ...updates,
                    },
                },
            })),

        resetGame: () => set(INITIAL_STATE),
    }))
);
