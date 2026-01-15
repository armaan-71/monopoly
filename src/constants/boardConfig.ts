export interface PropertyConfig {
  name: string;
  price: number;
  rent: number[]; // [base, 1 house, 2 houses, 3 houses, 4 houses, hotel]
  colorGroup:
    | "brown"
    | "lightBlue"
    | "pink"
    | "orange"
    | "red"
    | "yellow"
    | "green"
    | "darkBlue"
    | "station"
    | "utility"
    | "none";
  houseCost: number;
  type:
    | "property"
    | "railroad"
    | "utility"
    | "tax"
    | "chance"
    | "chest"
    | "corner";
}

export const BOARD_CONFIG: Record<number, PropertyConfig> = {
  0: {
    name: "GO",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "corner",
  },
  1: {
    name: "Mediterranean Avenue",
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    colorGroup: "brown",
    houseCost: 50,
    type: "property",
  },
  2: {
    name: "Community Chest",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "chest",
  },
  3: {
    name: "Baltic Avenue",
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    colorGroup: "brown",
    houseCost: 50,
    type: "property",
  },
  4: {
    name: "Income Tax",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "tax",
  },
  5: {
    name: "Reading Railroad",
    price: 200,
    rent: [25, 50, 100, 200],
    colorGroup: "station",
    houseCost: 0,
    type: "railroad",
  },
  6: {
    name: "Oriental Avenue",
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    colorGroup: "lightBlue",
    houseCost: 50,
    type: "property",
  },
  7: {
    name: "Chance",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "chance",
  },
  8: {
    name: "Vermont Avenue",
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    colorGroup: "lightBlue",
    houseCost: 50,
    type: "property",
  },
  9: {
    name: "Connecticut Avenue",
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    colorGroup: "lightBlue",
    houseCost: 50,
    type: "property",
  },
  10: {
    name: "Jail",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "corner",
  },
  11: {
    name: "St. Charles Place",
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    colorGroup: "pink",
    houseCost: 100,
    type: "property",
  },
  12: {
    name: "Electric Company",
    price: 150,
    rent: [],
    colorGroup: "utility",
    houseCost: 0,
    type: "utility",
  },
  13: {
    name: "States Avenue",
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    colorGroup: "pink",
    houseCost: 100,
    type: "property",
  },
  14: {
    name: "Virginia Avenue",
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    colorGroup: "pink",
    houseCost: 100,
    type: "property",
  },
  15: {
    name: "Pennsylvania Railroad",
    price: 200,
    rent: [25, 50, 100, 200],
    colorGroup: "station",
    houseCost: 0,
    type: "railroad",
  },
  16: {
    name: "St. James Place",
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    colorGroup: "orange",
    houseCost: 100,
    type: "property",
  },
  17: {
    name: "Community Chest",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "chest",
  },
  18: {
    name: "Tennessee Avenue",
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    colorGroup: "orange",
    houseCost: 100,
    type: "property",
  },
  19: {
    name: "New York Avenue",
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    colorGroup: "orange",
    houseCost: 100,
    type: "property",
  },
  20: {
    name: "Free Parking",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "corner",
  },
  21: {
    name: "Kentucky Avenue",
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    colorGroup: "red",
    houseCost: 150,
    type: "property",
  },
  22: {
    name: "Chance",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "chance",
  },
  23: {
    name: "Indiana Avenue",
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    colorGroup: "red",
    houseCost: 150,
    type: "property",
  },
  24: {
    name: "Illinois Avenue",
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    colorGroup: "red",
    houseCost: 150,
    type: "property",
  },
  25: {
    name: "B. & O. Railroad",
    price: 200,
    rent: [25, 50, 100, 200],
    colorGroup: "station",
    houseCost: 0,
    type: "railroad",
  },
  26: {
    name: "Atlantic Avenue",
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    colorGroup: "yellow",
    houseCost: 150,
    type: "property",
  },
  27: {
    name: "Ventnor Avenue",
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    colorGroup: "yellow",
    houseCost: 150,
    type: "property",
  },
  28: {
    name: "Water Works",
    price: 150,
    rent: [],
    colorGroup: "utility",
    houseCost: 0,
    type: "utility",
  },
  29: {
    name: "Marvin Gardens",
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    colorGroup: "yellow",
    houseCost: 150,
    type: "property",
  },
  30: {
    name: "Go To Jail",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "corner",
  },
  31: {
    name: "Pacific Avenue",
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    colorGroup: "green",
    houseCost: 200,
    type: "property",
  },
  32: {
    name: "North Carolina Avenue",
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    colorGroup: "green",
    houseCost: 200,
    type: "property",
  },
  33: {
    name: "Community Chest",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "chest",
  },
  34: {
    name: "Pennsylvania Avenue",
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    colorGroup: "green",
    houseCost: 200,
    type: "property",
  },
  35: {
    name: "Short Line",
    price: 200,
    rent: [25, 50, 100, 200],
    colorGroup: "station",
    houseCost: 0,
    type: "railroad",
  },
  36: {
    name: "Chance",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "chance",
  },
  37: {
    name: "Park Place",
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    colorGroup: "darkBlue",
    houseCost: 200,
    type: "property",
  },
  38: {
    name: "Luxury Tax",
    price: 0,
    rent: [],
    colorGroup: "none",
    houseCost: 0,
    type: "tax",
  },
  39: {
    name: "Boardwalk",
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    colorGroup: "darkBlue",
    houseCost: 200,
    type: "property",
  },
};
