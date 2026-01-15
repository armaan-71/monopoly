import { BOARD_CONFIG } from "@/constants/boardConfig";
import { PlayerState, PropertyState } from "@/types/game";

export const calculateRent = (
  propertyIndex: number,
  propertyState: PropertyState,
  diceRoll: number
): number => {
  const config = BOARD_CONFIG[propertyIndex];
  if (!config || !propertyState) return 0;

  if (config.type === "utility") {
    const multiplier = propertyState.owner ? 4 : 10; // Simplify for now: check if owner owns both
    return diceRoll * multiplier;
  }

  if (config.type === "railroad") {
    // Logic to check how many railroads owner has
    return 25; // Placeholder
  }

  if (propertyState.houses > 0) {
    return config.rent[propertyState.houses];
  }

  return config.rent[0]; // Base rent
};

export const canBuyProperty = (
  player: PlayerState,
  propertyIndex: number
): boolean => {
  const config = BOARD_CONFIG[propertyIndex];
  if (!config || !["property", "railroad", "utility"].includes(config.type))
    return false;
  return player.money >= config.price;
};
