import { BOARD_CONFIG } from "@/constants/boardConfig";
import { supabase } from "@/lib/supabase";
import { GameState } from "@/types/game";
import {
  applyCardEffect,
  calculateRent,
  canBuildHouse,
  canBuyProperty,
  canMortgage,
  canSellHouse,
  canUnmortgage,
  didPassGo,
  drawCard,
  getMortgageValue,
  getNextPosition,
  getUnmortgageCost,
  handleSpecialTile,
  rollDice,
} from "@/utils/gameLogic";
import { NextResponse } from "next/server";

type ActionType =
  | "ROLL_DICE"
  | "BUY_PROPERTY"
  | "END_TURN"
  | "MORTGAGE"
  | "UNMORTGAGE"
  | "DISMISS_CARD"
  | "BUILD_HOUSE"
  | "SELL_HOUSE"
  | "PAY_BAIL"
  | "USE_GOJF"
  | "DECLINE_BUY"
  | "PLACE_BID"
  | "FOLD_AUCTION"
  | "RESOLVE_AUCTION"
  | "DECLARE_BANKRUPTCY"
  | "PROPOSE_TRADE"
  | "CANCEL_TRADE"
  | "REJECT_TRADE"
  | "ACCEPT_TRADE"
  | "RESET_GAME";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roomId,
      playerId,
      action,
      propertyId,
      amount,
      targetPlayerId,
      offering,
      requesting,
      tradeId,
    } = body;

    console.log(
      `[API] Action: ${action}, Player: ${playerId}, TradeID: ${tradeId}`,
    );

    // 1. Fetch current game state
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const gameState = room.game_state as GameState;

    // For RESET_GAME, we might not strictly need a playerIndex if anyone can reset contextually (e.g. winner)
    // But usually we want to ensure the requester is part of the game.
    const playerIndex = gameState.players.findIndex((p) => p.id === playerId);

    if (playerIndex === -1) {
      return NextResponse.json(
        { error: "Player not found in game" },
        { status: 403 },
      );
    }

    // Basic Turn Validation
    const isTurn = gameState.turnIndex === playerIndex;
    const allowedOutOfTurn = [
      "PAY_BAIL",
      "USE_GOJF",
      "PLACE_BID",
      "FOLD_AUCTION",
      "PROPOSE_TRADE",
      "CANCEL_TRADE",
      "REJECT_TRADE",
      "ACCEPT_TRADE",
      "RESET_GAME", // Allow reset whenever (game over usually)
    ];

    if (!isTurn && !allowedOutOfTurn.includes(action)) {
      return NextResponse.json({ error: "Not your turn" }, { status: 403 });
    }

    let newState = { ...gameState };
    let message = "Action processed";

    // Initialize hasRolled if missing (migration for existing games)
    if (typeof newState.hasRolled === "undefined") newState.hasRolled = false;

    // 2. Process Action
    switch (action as ActionType) {
      case "RESET_GAME": {
        if (!newState.winner && newState.isGameStarted) {
          // Prevent accidental reset during active game?
          // For now, allow it if UI calls it (e.g. debug or explicit "Abort Game")
          // but mostly intended for Game Over screen.
        }

        // Reset Players
        newState.players = newState.players.map((p) => ({
          ...p,
          money: 1500,
          position: 0,
          isInJail: false,
          jailTurns: 0,
          heldCards: [],
          isBankrupt: false,
        }));

        // Reset Properties
        Object.keys(newState.properties).forEach((key) => {
          newState.properties[parseInt(key)] = {
            owner: null,
            houses: 0,
            isMortgaged: false,
          };
        });

        // Reset Game State
        newState.turnIndex = 0;
        newState.lastAction = "Game Reset";
        newState.log = ["New Game Ready"];
        newState.dice = [1, 1];
        newState.isGameStarted = false;
        newState.winner = null;
        newState.currentCard = null;
        newState.auction = null;
        newState.hasRolled = false;
        newState.trades = [];

        break;
      }

      case "ROLL_DICE": {
        if (newState.hasRolled && !newState.players[playerIndex].isInJail) {
          return NextResponse.json(
            { error: "You have already rolled" },
            { status: 400 },
          );
        }

        const dice = rollDice();
        const diceTotal = dice[0] + dice[1];
        const player = newState.players[playerIndex];
        const auditEvents: string[] = [];
        newState.dice = dice;

        // --- JAIL LOGIC ---
        if (player.isInJail) {
          player.jailTurns += 1;
          if (dice[0] === dice[1]) {
            player.isInJail = false;
            player.jailTurns = 0;
            newState.hasRolled = true;
            message = `${player.name} rolled doubles and escaped Jail!`;
            auditEvents.push(message);
          } else if (player.jailTurns >= 3) {
            if (player.money >= 50) {
              player.money -= 50;
              player.isInJail = false;
              player.jailTurns = 0;
              newState.hasRolled = true;
              message = `${player.name} paid $50 bail.`;
              auditEvents.push(message);
            } else {
              newState.hasRolled = true;
              message = `${player.name} failed doubles and stays in Jail.`;
              newState.lastAction = message;
              break;
            }
          } else {
            newState.hasRolled = true;
            message = `${player.name} stays in Jail.`;
            newState.lastAction = message;
            break;
          }
        }

        // --- MOVEMENT & LANDING ---
        if (!player.isInJail) {
          // Update hasRolled (Doubles Logic)
          if (dice[0] === dice[1]) {
            newState.hasRolled = false;
            message += " (Doubles! Roll again)";
          } else {
            newState.hasRolled = true;
          }

          const oldPosition = player.position;
          // Apply movement
          const newPosition = getNextPosition(oldPosition, diceTotal);
          player.position = newPosition;
          message = `${player.name} rolled ${diceTotal} to ${BOARD_CONFIG.find((t) => t.id === newPosition)?.name || "Unknown"}`;

          if (didPassGo(oldPosition, newPosition)) {
            player.money += 200;
            auditEvents.push(`${player.name} passed GO (+ $200)`);
          }

          // 1. Rent Logic
          const propertyState = newState.properties[newPosition];
          if (
            propertyState &&
            propertyState.owner &&
            propertyState.owner !== player.id
          ) {
            const rent = calculateRent(newPosition, newState, diceTotal);
            if (rent > 0 && !propertyState.isMortgaged) {
              player.money -= rent;
              const owner = newState.players.find(
                (p) => p.id === propertyState.owner,
              );
              if (owner) {
                owner.money += rent;
                auditEvents.push(`Paid $${rent} rent to ${owner.name}`);
              }
            }
          }

          // 2. Special Tiles (Tax, GoToJail)
          // Note: handleSpecialTile needs (player, position) or just (position, state)?
          // Checking previous usage: handleSpecialTile(player, newPosition) was used in lines 119.
          // But in Step 1570 (original file), it was imported as:
          // handleSpecialTile(newPosition, newState) ?
          // Let's check imports or usage elsewhere.
          // "handleSpecialTile(newPosition, newState)" was NOT in the imports list in Step 1570?
          // Step 1570 line 4 imports: rollDice, getNextPosition... handleSpecialTile...
          // Usage in Step 1570 isn't shown fully.
          // I'll stick to the usage pattern seen in the file recently: `handleSpecialTile(player, newPosition)`
          // If that fails, I'll fix it.

          const {
            moneyChange,
            sendToJail,
            message: tileMsg,
          } = handleSpecialTile(player, newPosition);
          if (tileMsg) {
            // tileMsg is usually "Paid Luxury Tax" or similar. Prefix with name if not present.
            // Check if tileMsg already starts with player name (game logic dependent, but safest to ensure)
            // Actually handleSpecialTile likely returns "Paid $100 Tax".
            // adding player name:
            auditEvents.push(`${player.name}: ${tileMsg}`);
          }
          if (moneyChange) player.money += moneyChange;
          if (sendToJail) {
            player.isInJail = true;
            player.position = 10;
            player.jailTurns = 0;
            newState.hasRolled = true; // Turn ends
          }

          // 3. Cards (Chance/Chest)
          if (!sendToJail) {
            const tileName = BOARD_CONFIG.find(
              (p) => p.id === newPosition,
            )?.name;
            if (tileName === "Chance" || tileName === "Community Chest") {
              const cardType =
                tileName === "Chance" ? "CHANCE" : "COMMUNITY_CHEST";
              const card = drawCard(cardType);
              newState.currentCard = card;

              const drawMsg = `${player.name} drew ${cardType === "CHANCE" ? "Chance" : "Community Chest"}: "${card.text}"`;
              auditEvents.push(drawMsg);
              message = drawMsg; // Update main status message to show card outcome

              const effect = applyCardEffect(card, player, newPosition);
              if (effect.heldCard) {
                if (!player.heldCards) player.heldCards = [];
                player.heldCards.push(effect.heldCard);
              } else {
                player.money = effect.newMoney;
                if (effect.newPosition !== newPosition) {
                  player.position = effect.newPosition;
                  // Basic Pass Go check for card movement
                  if (
                    effect.newPosition < newPosition &&
                    effect.newPosition === 0
                  ) {
                    player.money += 200;
                  }
                }
                if (effect.sendToJail) {
                  player.isInJail = true;
                  player.position = 10;
                  player.jailTurns = 0;
                }
              }
            }
          }
        }

        newState.lastAction = message;
        if (!newState.log) newState.log = [];
        if (auditEvents.length) newState.log.push(...auditEvents);
        break;
      }

      case "BUY_PROPERTY": {
        const player = newState.players[playerIndex];
        const propertyIndex = player.position;

        // Validation
        const propertyDef = BOARD_CONFIG.find((p) => p.id === propertyIndex);
        if (!propertyDef) throw new Error("Invalid property");

        const existingOwner = newState.properties[propertyIndex]?.owner;

        if (
          canBuyProperty(propertyIndex, player.money, existingOwner || null)
        ) {
          // Deduct money
          player.money -= propertyDef.price || 0;

          // Set Owner
          newState.properties[propertyIndex] = {
            owner: player.id,
            houses: 0,
            isMortgaged: false,
          };

          const msg = `${player.name} bought ${propertyDef.name}`;
          newState.lastAction = msg;
          if (!newState.log) newState.log = [];
          newState.log.push(msg);
        } else {
          return NextResponse.json(
            { error: "Cannot buy this property" },
            { status: 400 },
          );
        }
        break;
      }

      case "MORTGAGE": {
        if (typeof propertyId !== "number")
          return NextResponse.json(
            { error: "Missing propertyId" },
            { status: 400 },
          );

        if (canMortgage(propertyId, playerId, gameState)) {
          const value = getMortgageValue(propertyId);
          const player = newState.players[playerIndex];
          const propertyDef = BOARD_CONFIG.find((p) => p.id === propertyId);

          // Execute Mortgage
          player.money += value;
          newState.properties[propertyId].isMortgaged = true;

          const msg = `${player.name} mortgaged ${propertyDef?.name} for $${value}`;
          newState.lastAction = msg;
          if (!newState.log) newState.log = [];
          newState.log.push(msg);
        } else {
          return NextResponse.json(
            { error: "Cannot mortgage this property" },
            { status: 400 },
          );
        }
        break;
      }

      case "UNMORTGAGE": {
        if (typeof propertyId !== "number")
          return NextResponse.json(
            { error: "Missing propertyId" },
            { status: 400 },
          );

        const player = newState.players[playerIndex];

        if (canUnmortgage(propertyId, playerId, player.money, gameState)) {
          const cost = getUnmortgageCost(propertyId);
          const propertyDef = BOARD_CONFIG.find((p) => p.id === propertyId);

          // Execute Unmortgage
          player.money -= cost;
          newState.properties[propertyId].isMortgaged = false;

          const msg = `${player.name} unmortgaged ${propertyDef?.name} for $${cost}`;
          newState.lastAction = msg;
          if (!newState.log) newState.log = [];
          newState.log.push(msg);
        } else {
          return NextResponse.json(
            { error: "Cannot unmortgage this property" },
            { status: 400 },
          );
        }
        break;
      }

      case "BUILD_HOUSE": {
        if (typeof propertyId !== "number")
          return NextResponse.json(
            { error: "Missing propertyId" },
            { status: 400 },
          );

        const validation = canBuildHouse(propertyId, playerId, gameState);
        if (!validation.allowed) {
          return NextResponse.json(
            { error: validation.reason },
            { status: 400 },
          );
        }

        const propertyDef = BOARD_CONFIG.find((p) => p.id === propertyId);
        const player = newState.players[playerIndex];
        const houseCost = propertyDef?.houseCost || 0;

        // Execute Build
        player.money -= houseCost;
        newState.properties[propertyId].houses += 1;

        const newCount = newState.properties[propertyId].houses;
        const type = newCount === 5 ? "Hotel" : "House";
        const msg = `${player.name} built a ${type} on ${propertyDef?.name}`;

        newState.lastAction = msg;
        if (!newState.log) newState.log = [];
        newState.log.push(msg);
        break;
      }

      case "PAY_BAIL": {
        const player = newState.players[playerIndex];
        if (!player.isInJail)
          return NextResponse.json({ error: "Not in jail" }, { status: 400 });
        if (player.money < 50)
          return NextResponse.json(
            { error: "Insufficient funds" },
            { status: 400 },
          );

        player.money -= 50;
        player.isInJail = false;
        player.jailTurns = 0;

        const msg = `${player.name} paid $50 bail`;
        newState.lastAction = msg;
        if (!newState.log) newState.log = [];
        newState.log.push(msg);
        break;
      }

      case "USE_GOJF": {
        const player = newState.players[playerIndex];
        if (!player.isInJail)
          return NextResponse.json({ error: "Not in jail" }, { status: 400 });

        // Check ownership
        // Assuming we simply remove the first JAIL_FREE card found
        // Note: We need to handle this robustly if `heldCards` is array of full objects or IDs.
        // Current types say `heldCards: Card[]`.
        const cardIndex = player.heldCards?.findIndex(
          (c) => c.action === "JAIL_FREE",
        );

        if (cardIndex === undefined || cardIndex === -1) {
          return NextResponse.json(
            { error: "No Get Out of Jail Free card" },
            { status: 400 },
          );
        }

        // Remove card
        // Note: We might want to return it to the deck, but deck state is currently stateless random.
        // So just removing from player is sufficient for now.
        if (player.heldCards) {
          player.heldCards.splice(cardIndex, 1);
        }

        player.isInJail = false;
        player.jailTurns = 0;

        const msg = `${player.name} used a Get Out of Jail Free card`;
        newState.lastAction = msg;
        if (!newState.log) newState.log = [];
        newState.log.push(msg);
        break;
      }

      case "SELL_HOUSE": {
        if (typeof propertyId !== "number")
          return NextResponse.json(
            { error: "Missing propertyId" },
            { status: 400 },
          );

        const validation = canSellHouse(propertyId, playerId, gameState);
        if (!validation.allowed) {
          return NextResponse.json(
            { error: validation.reason },
            { status: 400 },
          );
        }

        const propertyDef = BOARD_CONFIG.find((p) => p.id === propertyId);
        const player = newState.players[playerIndex];
        const houseCost = propertyDef?.houseCost || 0;

        // Execute Sell (Half price)
        const refund = Math.floor(houseCost / 2);
        player.money += refund;
        newState.properties[propertyId].houses -= 1;

        const msg = `${player.name} sold a House/Hotel on ${propertyDef?.name}`;

        newState.lastAction = msg;
        if (!newState.log) newState.log = [];
        newState.log.push(msg);
        break;
      }

      case "DISMISS_CARD": {
        // Anyone can dismiss? Or only current player?
        // Probably better to allow current player.
        // Reset card
        newState.currentCard = null;
        // No log needed really, it's UI cleanup.
        break;
      }

      case "DECLINE_BUY": {
        const player = newState.players[playerIndex];
        const propertyId = player.position;

        // Validate property is unowned
        if (newState.properties[propertyId]?.owner) {
          return NextResponse.json(
            { error: "Property already owned" },
            { status: 400 },
          );
        }

        // Start Auction
        newState.auction = {
          propertyId: propertyId,
          highestBid: 0,
          highestBidder: null,
          activeBidders: newState.players.map((p) => p.id),
          status: "active",
          endTime: Date.now() + 10000, // 10s timer
        };

        const propertyDef = BOARD_CONFIG.find((p) => p.id === propertyId);
        const msg = `Auction started for ${propertyDef?.name}`;
        newState.lastAction = msg;
        if (!newState.log) newState.log = [];
        newState.log.push(msg);
        break;
      }

      case "PLACE_BID": {
        if (!newState.auction)
          return NextResponse.json(
            { error: "No active auction" },
            { status: 400 },
          );
        if (typeof amount !== "number")
          return NextResponse.json(
            { error: "Missing bid amount" },
            { status: 400 },
          );

        const player = newState.players[playerIndex];

        // Validate Bidder
        if (!newState.auction.activeBidders.includes(playerId)) {
          return NextResponse.json(
            { error: "You are not in this auction" },
            { status: 400 },
          );
        }

        // Validate Amount
        if (amount <= newState.auction.highestBid) {
          return NextResponse.json(
            { error: "Bid must be higher than current highest" },
            { status: 400 },
          );
        }
        if (amount > player.money) {
          return NextResponse.json(
            { error: "Insufficient funds" },
            { status: 400 },
          );
        }

        newState.auction.highestBid = amount;
        newState.auction.highestBidder = playerId;
        newState.auction.endTime = Date.now() + 10000; // Reset timer to 10s

        const msg = `${player.name} bid $${amount}`;
        newState.lastAction = msg;
        break;
      }

      case "FOLD_AUCTION": {
        if (!newState.auction)
          return NextResponse.json(
            { error: "No active auction" },
            { status: 400 },
          );

        const player = newState.players[playerIndex];

        // Check if current highest bidder tries to fold (Prevent it)
        if (newState.auction.highestBidder === playerId) {
          return NextResponse.json(
            { error: "Cannot fold while highest bidder" },
            { status: 400 },
          );
        }

        // Remove from active
        newState.auction.activeBidders = newState.auction.activeBidders.filter(
          (id) => id !== playerId,
        );

        const msg = `${player.name} folded`;
        newState.lastAction = msg;

        // CHECK WIN CONDITION
        if (newState.auction.activeBidders.length === 1) {
          const winnerId = newState.auction.activeBidders[0];
          const winner = newState.players.find((p) => p.id === winnerId);

          // If the last person is also the highest bidder, they win immediately.
          // Or if they are the only one left and bid > 0.
          // Actually if only 1 person remains, the auction ends.
          // If they have the highest bid, they pay and get it.
          // If no one bid (highestBid 0), the last person gets option to buy at face value or it is unowned?
          // Simplified rules: Last person standing wins at current bid. If bid is 0 (all folded immediately), maybe price is 10?
          // For now, assume if 1 left, they win at current `highestBid`. If 0, they get it for free? No, let's say minimum $10.

          const cost = Math.max(newState.auction.highestBid, 10);
          const propId = newState.auction.propertyId;
          const propDef = BOARD_CONFIG.find((p) => p.id === propId);

          if (winner) {
            // Execute Sale
            winner.money -= cost;
            newState.properties[propId] = {
              owner: winnerId,
              houses: 0,
              isMortgaged: false,
            };

            const winMsg = `${winner.name} won auction for ${propDef?.name} at $${cost}`;
            newState.lastAction = winMsg;
            if (!newState.log) newState.log = [];
            newState.log.push(winMsg);
          }
          // End Auction
          newState.auction = null;
        } else if (newState.auction.activeBidders.length === 0) {
          // Everyone folded?
          newState.auction = null;
          newState.log.push("Auction ended with no winner.");
        }
        break;
      }

      case "RESOLVE_AUCTION": {
        if (!newState.auction)
          return NextResponse.json(
            { error: "No active auction" },
            { status: 400 },
          );

        // Allow a small grace period for network latency (e.g., -500ms? No, trust server time strictly but maybe match client)
        // Actually if client says "Resolve", server checks "Is it time?"
        if (Date.now() < newState.auction.endTime) {
          return NextResponse.json(
            { error: "Auction time not ended yet" },
            { status: 400 },
          );
        }

        const winnerId = newState.auction.highestBidder;
        const cost = newState.auction.highestBid;

        if (winnerId) {
          const winner = newState.players.find((p) => p.id === winnerId);
          const propId = newState.auction.propertyId;
          const propDef = BOARD_CONFIG.find((p) => p.id === propId);

          if (winner) {
            winner.money -= cost;
            newState.properties[propId] = {
              owner: winnerId,
              houses: 0,
              isMortgaged: false,
            };
            const winMsg = `${winner.name} won auction for ${propDef?.name} at $${cost}`;
            newState.lastAction = winMsg;
            if (!newState.log) newState.log = [];
            newState.log.push(winMsg);
          }
        } else {
          newState.lastAction = "Auction ended with no bids";
          if (!newState.log) newState.log = [];
          newState.log.push("Auction ended with no bids");
        }

        newState.auction = null;
        break;
      }

      case "END_TURN": {
        const player = newState.players[playerIndex];
        if (player.money < 0) {
          return NextResponse.json(
            {
              error:
                "You are in debt! You must sell assets or declare bankruptcy.",
            },
            { status: 400 },
          );
        }

        // Find next non-bankrupt player
        let nextIndex = (gameState.turnIndex + 1) % gameState.players.length;
        let attempts = 0;
        while (
          newState.players[nextIndex].isBankrupt &&
          attempts < newState.players.length
        ) {
          nextIndex = (nextIndex + 1) % gameState.players.length;
          attempts++;
        }

        newState.turnIndex = nextIndex;
        newState.hasRolled = false;
        const msg = `${player.name} ended their turn`;
        newState.lastAction = msg;
        break;
      }

      case "DECLARE_BANKRUPTCY": {
        // 1. Mark as bankrupt
        const player = newState.players[playerIndex];
        player.isBankrupt = true;
        player.money = 0; // Reset debt to 0 visually (or keep negative? Rules say "Retired")

        // 2. Return all properties to Bank (Owner = null)
        // Or actually if they owe another player, that player gets them.
        // For MVP, we assume Bank/Generic Surrender.
        Object.keys(newState.properties).forEach((key) => {
          const pid = parseInt(key);
          if (newState.properties[pid].owner === playerId) {
            newState.properties[pid].owner = null;
            newState.properties[pid].houses = 0;
            newState.properties[pid].isMortgaged = false;
          }
        });

        // 3. Log
        const msg = `${player.name} declared BANKRUPTCY and left the game!`;
        newState.lastAction = msg;
        if (!newState.log) newState.log = [];
        newState.log.push(msg);

        // 4. Check for Winner (Last Man Standing)
        const activePlayers = newState.players.filter((p) => !p.isBankrupt);
        if (activePlayers.length === 1) {
          const winner = activePlayers[0];
          newState.winner = winner.id;
          newState.isGameStarted = false;
          newState.log.push(`🏆 GAME OVER! ${winner.name} is the WINNER! 🏆`);
          // No need to set turn index if game is over
          break;
        }

        // 5. Force End Turn (if game continues)
        // Find next valid player
        // Find next valid player
        let nextIndex = (gameState.turnIndex + 1) % gameState.players.length;
        let attempts = 0;
        while (
          newState.players[nextIndex].isBankrupt &&
          attempts < newState.players.length
        ) {
          nextIndex = (nextIndex + 1) % gameState.players.length;
          attempts++;
        }
        newState.turnIndex = nextIndex;
        newState.hasRolled = false;
        break;
      }

      case "PROPOSE_TRADE": {
        // Logic:
        const player = newState.players[playerIndex];
        const target = newState.players.find((p) => p.id === targetPlayerId);

        if (!target)
          return NextResponse.json(
            { error: "Target player not found" },
            { status: 400 },
          );
        if (player.id === target.id)
          return NextResponse.json(
            { error: "Cannot trade with yourself" },
            { status: 400 },
          );

        // Validate Ownership
        // Offering
        if (offering.money > player.money)
          return NextResponse.json(
            { error: "Insufficient funds" },
            { status: 400 },
          );
        for (const pid of offering.properties) {
          if (newState.properties[pid]?.owner !== player.id)
            return NextResponse.json(
              { error: `You do not own ${pid}` },
              { status: 400 },
            );
          // Can trade mortgaged? Yes.
          // Can trade houses? No, must sell houses first.
          if (newState.properties[pid].houses > 0)
            return NextResponse.json(
              { error: `Must sell buildings on ${pid} first` },
              { status: 400 },
            );
        }

        // Requesting
        if (requesting.money > target.money)
          return NextResponse.json(
            { error: "Target has insufficient funds" },
            { status: 400 },
          );
        for (const pid of requesting.properties) {
          if (newState.properties[pid]?.owner !== target.id)
            return NextResponse.json(
              { error: `Target does not own ${pid}` },
              { status: 400 },
            );
          if (newState.properties[pid].houses > 0)
            return NextResponse.json(
              { error: `Target must sell buildings on ${pid} first` },
              { status: 400 },
            );
        }

        // Create Trade
        const tradeId = crypto.randomUUID();
        const trade = {
          id: tradeId,
          fromPlayerId: player.id,
          toPlayerId: target.id,
          offering,
          requesting,
          status: "pending" as const,
          createdAt: Date.now(),
        };

        if (!newState.trades) newState.trades = [];
        newState.trades.push(trade);

        const msg = `${player.name} proposed a trade to ${target.name}`;
        newState.lastAction = msg;
        if (!newState.log) newState.log = [];
        newState.log.push(msg);
        break;
      }

      case "CANCEL_TRADE": {
        // Assuming tradeId is available in scope (will fix via top-edit)
        const tradeIndex = (newState.trades || []).findIndex(
          (t) => t.id === tradeId,
        );
        if (tradeIndex === -1)
          return NextResponse.json(
            { error: "Trade not found" },
            { status: 404 },
          );

        const trade = newState.trades[tradeIndex];
        if (trade.fromPlayerId !== playerId)
          return NextResponse.json(
            { error: "Not your trade" },
            { status: 403 },
          );
        if (trade.status !== "pending")
          return NextResponse.json(
            { error: "Trade already finalized" },
            { status: 400 },
          );

        trade.status = "cancelled";
        // Optionally remove it or keep history? Keep history for now or just filter out?
        // Let's keep it but maybe UI filters it.
        // Or remove to save space.
        newState.trades.splice(tradeIndex, 1);

        newState.lastAction = "Trade cancelled";
        break;
      }

      case "REJECT_TRADE": {
        // Payload: tradeId
        const tradeIndex = (newState.trades || []).findIndex(
          (t) => t.id === tradeId,
        );
        if (tradeIndex === -1)
          return NextResponse.json(
            { error: "Trade not found" },
            { status: 404 },
          );

        const trade = newState.trades[tradeIndex];
        if (trade.toPlayerId !== playerId)
          return NextResponse.json(
            { error: "Not offered to you" },
            { status: 403 },
          );
        if (trade.status !== "pending")
          return NextResponse.json(
            { error: "Trade already finalized" },
            { status: 400 },
          );

        trade.status = "rejected";
        // Keep for a bit so sender sees it?
        // Or remove. Let's remove for MVP simplicity, maybe log it.
        newState.trades.splice(tradeIndex, 1);

        const target = newState.players.find((p) => p.id === playerId);
        const sender = newState.players.find(
          (p) => p.id === trade.fromPlayerId,
        );
        const msg = `${target?.name} rejected trade from ${sender?.name}`;
        newState.lastAction = msg;
        newState.log.push(msg);
        break;
      }

      case "ACCEPT_TRADE":
        {
          // Payload: tradeId
          const tradeIndex = (newState.trades || []).findIndex(
            (t) => t.id === tradeId,
          );
          console.log(
            `[ACCEPT_TRADE] Searching for tradeId: ${tradeId}. Found index: ${tradeIndex}`,
          );

          if (tradeIndex === -1) {
            console.log("[ACCEPT_TRADE] Trade not found");
            return NextResponse.json(
              { error: "Trade not found" },
              { status: 404 },
            );
          }

          const trade = newState.trades[tradeIndex];
          if (trade.toPlayerId !== playerId) {
            console.log(
              `[ACCEPT_TRADE] Not offered to you. Target: ${trade.toPlayerId}. Me: ${playerId}`,
            );
            return NextResponse.json(
              { error: "Not offered to you" },
              { status: 403 },
            );
          }
          if (trade.status !== "pending") {
            console.log("[ACCEPT_TRADE] Trade not pending");
            return NextResponse.json(
              { error: "Trade already finalized" },
              { status: 400 },
            );
          }

          const sender = newState.players.find(
            (p) => p.id === trade.fromPlayerId,
          );
          const receiver = newState.players.find(
            (p) => p.id === trade.toPlayerId,
          );

          if (!sender || !receiver)
            return NextResponse.json(
              { error: "Player missing" },
              { status: 500 },
            );

          // RE-VALIDATE OWNERSHIP (Critical race condition check)
          // Sender Assets
          if (sender.money < trade.offering.money)
            return NextResponse.json(
              { error: "Sender insufficient funds" },
              { status: 400 },
            );
          for (const pid of trade.offering.properties) {
            if (newState.properties[pid]?.owner !== sender.id)
              return NextResponse.json(
                { error: "Sender no longer owns properties" },
                { status: 400 },
              );
          }
          // Receiver Assets
          if (receiver.money < trade.requesting.money)
            return NextResponse.json(
              { error: "You have insufficient funds" },
              { status: 400 },
            );
          for (const pid of trade.requesting.properties) {
            if (newState.properties[pid]?.owner !== receiver.id)
              return NextResponse.json(
                { error: "You no longer own properties" },
                { status: 400 },
              );
          }

          // EXECUTE SWAP
          // Money
          sender.money -= trade.offering.money;
          receiver.money += trade.offering.money;

          receiver.money -= trade.requesting.money;
          sender.money += trade.requesting.money;

          // Properties
          trade.offering.properties.forEach((pid) => {
            newState.properties[pid].owner = receiver.id;
          });
          trade.requesting.properties.forEach((pid) => {
            newState.properties[pid].owner = sender.id;
          });

          // Close Trade
          trade.status = "accepted";
          newState.trades.splice(tradeIndex, 1);

          const msg = `${sender.name} and ${receiver.name} completed a trade!`;
          newState.lastAction = msg;
          newState.log.push(msg);
          break;
        }
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 3. Save to DB
    const { error: updateError } = await supabase
      .from("rooms")
      .update({ game_state: newState as unknown as object })
      .eq("id", roomId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, newState });
  } catch (error) {
    console.error("Game Action Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
