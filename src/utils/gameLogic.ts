import { BOARD_CONFIG } from "@/constants/boardConfig";
import { PropertyState, GameState, PlayerState } from "@/types/game";
import { Card, CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from "@/constants/cards";

export const rollDice = (): [number, number] => {
  return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
};

export const getNextPosition = (
  currentPosition: number,
  diceTotal: number,
): number => {
  return (currentPosition + diceTotal) % 40;
};

export const didPassGo = (
  currentPosition: number,
  nextPosition: number,
): boolean => {
  return nextPosition < currentPosition;
};

export const canBuyProperty = (
  propertyIndex: number,
  playerMoney: number,
  existingOwner: string | null,
): boolean => {
  const property = BOARD_CONFIG.find((p) => p.id === propertyIndex);
  if (!property || !property.price || property.group === "none") {
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
  diceTotal: number,
): number => {
  const propertyDef = BOARD_CONFIG.find((p) => p.id === propertyIndex);
  const propertyState = gameState.properties[propertyIndex];

  if (
    !propertyDef ||
    !propertyState ||
    !propertyState.owner ||
    propertyState.isMortgaged
  ) {
    return 0;
  }

  // Utilities (Electric Company, Water Works)
  // Rule: 4x dice if one owned, 10x if both owned
  if (
    propertyDef.group === "special" &&
    (propertyDef.name.includes("Electric") ||
      propertyDef.name.includes("Water"))
  ) {
    const utilityIds = [12, 28]; // Electric Company, Water Works
    const owner = propertyState.owner;
    const ownedCount = utilityIds.filter(
      (id) => gameState.properties[id]?.owner === owner,
    ).length;

    return ownedCount === 2 ? diceTotal * 10 : diceTotal * 4;
  }

  // Railroads
  // Rule: $25, $50, $100, $200 based on number owned
  if (
    propertyDef.group === "special" &&
    propertyDef.name.includes("Railroad")
  ) {
    const rrIds = [5, 15, 25, 35];
    const owner = propertyState.owner;
    const ownedCount = rrIds.filter(
      (id) => gameState.properties[id]?.owner === owner,
    ).length;
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
  position: number,
): { moneyChange: number; sendToJail: boolean; message?: string } => {
  const tile = BOARD_CONFIG.find((p) => p.id === position);
  if (!tile) return { moneyChange: 0, sendToJail: false };

  // Income Tax: Pay $200
  if (tile.name === "Income Tax") {
    return {
      moneyChange: -200,
      sendToJail: false,
      message: "Paid $200 Income Tax",
    };
  }

  // Luxury Tax: Pay $100
  if (tile.name === "Luxury Tax") {
    return {
      moneyChange: -100,
      sendToJail: false,
      message: "Paid $100 Luxury Tax",
    };
  }

  // Go To Jail
  if (tile.name === "Go To Jail") {
    return { moneyChange: 0, sendToJail: true, message: "Sent to Jail!" };
  }

  return { moneyChange: 0, sendToJail: false };
};

export const getMortgageValue = (propertyId: number): number => {
  const property = BOARD_CONFIG.find((p) => p.id === propertyId);
  return property && property.price ? Math.floor(property.price / 2) : 0;
};

export const getUnmortgageCost = (propertyId: number): number => {
  const mortgageValue = getMortgageValue(propertyId);
  return Math.floor(mortgageValue * 1.1);
};

export const canMortgage = (
  propertyId: number,
  playerId: string,
  gameState: GameState,
): boolean => {
  const property = gameState.properties[propertyId];
  if (!property || property.owner !== playerId || property.isMortgaged)
    return false;

  // For MVP, we are not checking if other properties in the group have houses yet.
  // Ideally: check all properties of same color group for houses > 0.
  return property.houses === 0;
};

export const canUnmortgage = (
  propertyId: number,
  playerId: string,
  playerMoney: number,
  gameState: GameState,
): boolean => {
  const property = gameState.properties[propertyId];
  if (!property || property.owner !== playerId || !property.isMortgaged)
    return false;

  const cost = getUnmortgageCost(propertyId);
  return playerMoney >= cost;
};

export const drawCard = (type: "CHANCE" | "COMMUNITY_CHEST"): Card => {
  const deck = type === "CHANCE" ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS;
  // Simple random draw for now (stateless deck)
  const randomIndex = Math.floor(Math.random() * deck.length);
  return deck[randomIndex];
};

export const applyCardEffect = (
  card: Card,
  player: PlayerState,
  currentPosition: number,
): {
  newMoney: number;
  newPosition: number;
  sendToJail: boolean;
  heldCard: Card | null;
  log: string;
} => {
  let newMoney = player.money;
  let newPosition = currentPosition;
  let sendToJail = false;
  let heldCard: Card | null = null;
  let log = "";

  switch (card.action) {
    case "MONEY":
      if (card.value) {
        newMoney += card.value;
        log =
          card.value > 0
            ? `${player.name} received $${card.value}`
            : `${player.name} paid $${Math.abs(card.value)}`;
      }
      break;
    case "MOVE":
      if (card.value !== undefined) {
        // Relative Move (negative value) or Absolute Move
        if (card.value < 0) {
          // Go Back X spaces
          newPosition = (currentPosition + card.value + 40) % 40;
        } else {
          newPosition = card.value;
        }
        log = `${player.name} moved to ${BOARD_CONFIG[newPosition].name}`;
      }
      break;
    case "JAIL":
      sendToJail = true;
      log = `${player.name} went to Jail!`;
      break;
    case "JAIL_FREE":
      heldCard = card;
      log = `${player.name} kept "Get Out of Jail Free"`;
      break;
  }

  return { newMoney, newPosition, sendToJail, heldCard, log };
};

// --- Housing Logic ---

export const getPropertyGroup = (group: string): number[] => {
  return BOARD_CONFIG.filter((p) => p.group === group).map((p) => p.id);
};

export const hasMonopoly = (
  playerId: string,
  group: string,
  gameState: GameState,
): boolean => {
  if (group === "none" || group === "special") return false;

  const propertyIds = getPropertyGroup(group);
  // Check if player owns ALL properties in this group
  return propertyIds.every(
    (id) => gameState.properties[id]?.owner === playerId,
  );
};

export const canBuildHouse = (
  propertyId: number,
  playerId: string,
  gameState: GameState,
): { allowed: boolean; reason?: string } => {
  const propertyDef = BOARD_CONFIG.find((p) => p.id === propertyId);
  const propertyState = gameState.properties[propertyId];

  if (!propertyDef || !propertyState)
    return { allowed: false, reason: "Invalid property" };
  if (propertyState.owner !== playerId)
    return { allowed: false, reason: "Not your property" };

  // Check Group
  if (
    !propertyDef.houseCost ||
    propertyDef.group === "none" ||
    propertyDef.group === "special"
  ) {
    return { allowed: false, reason: "Cannot build here" };
  }

  // Check Monopoly
  if (!hasMonopoly(playerId, propertyDef.group, gameState)) {
    return { allowed: false, reason: "Need Monopoly to build" };
  }

  // Check Max Houses
  if (propertyState.houses >= 5) {
    return { allowed: false, reason: "Max houses reached (Hotel)" };
  }

  // Check Mortgaged Assets in Group
  const groupIds = getPropertyGroup(propertyDef.group);
  const anyMortgaged = groupIds.some(
    (id) => gameState.properties[id]?.isMortgaged,
  );
  if (anyMortgaged) {
    return {
      allowed: false,
      reason: "Cannot build if any property in group is mortgaged",
    };
  }

  // Check "Even Build" Rule
  // You cannot build on this property if it has MORE houses than any other property in the group.
  // Difference max 1.
  // So current houses must be <= min houses in group.
  // Note: If I have [1, 0], min is 0. I cannot build on 1 (result 2) -> diff 2. Correct.
  // So current houses must be <= any other property's house count.

  const groupHouses = groupIds.map(
    (id) => gameState.properties[id]?.houses || 0,
  );
  const minHouses = Math.min(...groupHouses);

  if (propertyState.houses > minHouses) {
    return { allowed: false, reason: "Must build evenly" };
  }

  // Check Funds
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player || player.money < propertyDef.houseCost) {
    return { allowed: false, reason: "Insufficient funds" };
  }

  return { allowed: true };
};

export const canSellHouse = (
  propertyId: number,
  playerId: string,
  gameState: GameState,
): { allowed: boolean; reason?: string } => {
  const propertyDef = BOARD_CONFIG.find((p) => p.id === propertyId);
  const propertyState = gameState.properties[propertyId];

  if (!propertyDef || !propertyState)
    return { allowed: false, reason: "Invalid property" };
  if (propertyState.owner !== playerId)
    return { allowed: false, reason: "Not your property" };
  if (propertyState.houses <= 0)
    return { allowed: false, reason: "No houses to sell" };

  // Check "Even Sell" Rule
  // You cannot sell if this property has FEWER houses than any other property in group.
  // It must be at least as developed as the MAX in the group to peel off the top layer.
  // [4, 5] -> can sell 5 (result 4). Can sell 4? (result 3). Diff 2. No.
  // So housing count must be == max houses in group.
  const groupIds = getPropertyGroup(propertyDef.group);
  const groupHouses = groupIds.map(
    (id) => gameState.properties[id]?.houses || 0,
  );
  const maxHouses = Math.max(...groupHouses);

  if (propertyState.houses < maxHouses) {
    return {
      allowed: false,
      reason: "Must sell evenly (sell from most developed first)",
    };
  }

  return { allowed: true };
};
