export type CardAction = 'MOVE' | 'MONEY' | 'JAIL' | 'JAIL_FREE';

export interface Card {
    id: string;
    text: string;
    type: 'CHANCE' | 'COMMUNITY_CHEST';
    action: CardAction;
    value?: number; // Amount for MONEY, Position index for MOVE
    targetId?: number; // Specific tile ID for absolute movement
}

export const CHANCE_CARDS: Card[] = [
    { id: 'ch1', text: "Advance to Go (Collect $200)", type: 'CHANCE', action: 'MOVE', value: 0 },
    { id: 'ch2', text: "Advance to Illinois Ave", type: 'CHANCE', action: 'MOVE', value: 24 },
    { id: 'ch3', text: "Advance to St. Charles Place", type: 'CHANCE', action: 'MOVE', value: 11 },
    { id: 'ch4', text: "Advance to nearest Utility", type: 'CHANCE', action: 'MOVE', targetId: -1 }, // Special handling needed? For MVP stick to simple moves
    { id: 'ch5', text: "Advance to nearest Railroad", type: 'CHANCE', action: 'MOVE', targetId: -2 }, // Special handling needed?
    { id: 'ch6', text: "Bank pays you dividend of $50", type: 'CHANCE', action: 'MONEY', value: 50 },
    { id: 'ch7', text: "Get Out of Jail Free", type: 'CHANCE', action: 'JAIL_FREE' },
    { id: 'ch8', text: "Go Back 3 Spaces", type: 'CHANCE', action: 'MOVE', value: -3 }, // Relative move
    { id: 'ch9', text: "Go to Jail", type: 'CHANCE', action: 'JAIL' },
    { id: 'ch10', text: "Make general repairs on all your property", type: 'CHANCE', action: 'MONEY', value: -25 }, // Simplification
    { id: 'ch11', text: "Speeding fine $15", type: 'CHANCE', action: 'MONEY', value: -15 },
    { id: 'ch12', text: "Take a trip to Reading Railroad", type: 'CHANCE', action: 'MOVE', value: 5 },
    { id: 'ch13', text: "You have been elected Chairman of the Board. Pay each player $50", type: 'CHANCE', action: 'MONEY', value: -50 }, // Simplification: just pay bank for MVP or special logic? Let's do pay bank for MVP or complex logic later
    { id: 'ch14', text: "Your building loan matures. Collect $150", type: 'CHANCE', action: 'MONEY', value: 150 },
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
    { id: 'cc1', text: "Advance to Go (Collect $200)", type: 'COMMUNITY_CHEST', action: 'MOVE', value: 0 },
    { id: 'cc2', text: "Bank error in your favor. Collect $200", type: 'COMMUNITY_CHEST', action: 'MONEY', value: 200 },
    { id: 'cc3', text: "Doctor's fee. Pay $50", type: 'COMMUNITY_CHEST', action: 'MONEY', value: -50 },
    { id: 'cc4', text: "From sale of stock you get $50", type: 'COMMUNITY_CHEST', action: 'MONEY', value: 50 },
    { id: 'cc5', text: "Get Out of Jail Free", type: 'COMMUNITY_CHEST', action: 'JAIL_FREE' },
    { id: 'cc6', text: "Go to Jail", type: 'COMMUNITY_CHEST', action: 'JAIL' },
    { id: 'cc7', text: "Holiday Fund matures. Receive $100", type: 'COMMUNITY_CHEST', action: 'MONEY', value: 100 },
    { id: 'cc8', text: "Income tax refund. Collect $20", type: 'COMMUNITY_CHEST', action: 'MONEY', value: 20 },
    { id: 'cc9', text: "It is your birthday. Collect $10", type: 'COMMUNITY_CHEST', action: 'MONEY', value: 10 },
    { id: 'cc10', text: "Life insurance matures. Collect $100", type: 'COMMUNITY_CHEST', action: 'MONEY', value: 100 },
    { id: 'cc11', text: "Pay hospital fees of $100", type: 'COMMUNITY_CHEST', action: 'MONEY', value: -100 },
    { id: 'cc12', text: "Pay school fees of $50", type: 'COMMUNITY_CHEST', action: 'MONEY', value: -50 },
    { id: 'cc13', text: "Receive $25 consultancy fee", type: 'COMMUNITY_CHEST', action: 'MONEY', value: 25 },
    { id: 'cc14', text: "You have won second prize in a beauty contest. Collect $10", type: 'COMMUNITY_CHEST', action: 'MONEY', value: 10 },
    { id: 'cc15', text: "You inherit $100", type: 'COMMUNITY_CHEST', action: 'MONEY', value: 100 },
];
