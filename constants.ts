
import { PlayerColor, Coordinate } from './types';

// The Ludo board is a 15x15 grid.
// Coordinate system: x (0-14), y (0-14). Top-Left is 0,0.

export const BOARD_SIZE = 15;

export const COLORS = {
  [PlayerColor.BLUE]: {
    base: 'bg-sky-500',
    dark: 'bg-sky-700',
    light: 'bg-sky-200',
    border: 'border-sky-600',
    text: 'text-sky-600'
  },
  [PlayerColor.YELLOW]: {
    base: 'bg-yellow-400',
    dark: 'bg-yellow-600',
    light: 'bg-yellow-100',
    border: 'border-yellow-500',
    text: 'text-yellow-600'
  },
  [PlayerColor.RED]: {
    base: 'bg-red-600',
    dark: 'bg-red-800',
    light: 'bg-red-200',
    border: 'border-red-700',
    text: 'text-red-700'
  },
  [PlayerColor.GREEN]: {
    base: 'bg-green-600',
    dark: 'bg-green-800',
    light: 'bg-green-200',
    border: 'border-green-700',
    text: 'text-green-700'
  },
};

// Safe Zones (Stars + Starts)
export const SAFE_ZONES: Coordinate[] = [
  // Start Squares
  { x: 1, y: 6 },  // Blue Start
  { x: 8, y: 1 },  // Yellow Start
  { x: 13, y: 8 }, // Green Start
  { x: 6, y: 13 }, // Red Start
  // Stars (usually 8 squares from start)
  { x: 6, y: 2 },  // Blue Track Star
  { x: 12, y: 6 }, // Yellow Track Star
  { x: 8, y: 12 }, // Green Track Star
  { x: 2, y: 8 },  // Red Track Star
];

// The main 52-step loop.
// Strictly ordered sequence starting from Blue's start square.
export const GLOBAL_PATH: Coordinate[] = [
  // --- BLUE SECTOR ---
  // 1. Blue Start Arm (Right)
  { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 },
  // 2. Top Arm (Up)
  { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
  // 3. Top Turn (Right)
  { x: 7, y: 0 }, { x: 8, y: 0 },

  // --- YELLOW SECTOR ---
  // 4. Top Arm (Down) -> Yellow Start is first square here
  { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
  // 5. Right Arm (Right)
  { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 },
  // 6. Right Turn (Down)
  { x: 14, y: 7 }, { x: 14, y: 8 },

  // --- GREEN SECTOR ---
  // 7. Right Arm (Left) -> Green Start is first square here
  { x: 13, y: 8 }, { x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 }, { x: 9, y: 8 },
  // 8. Bottom Arm (Down)
  { x: 8, y: 9 }, { x: 8, y: 10 }, { x: 8, y: 11 }, { x: 8, y: 12 }, { x: 8, y: 13 }, { x: 8, y: 14 },
  // 9. Bottom Turn (Left)
  { x: 7, y: 14 }, { x: 6, y: 14 },

  // --- RED SECTOR ---
  // 10. Bottom Arm (Up) -> Red Start is first square here
  { x: 6, y: 13 }, { x: 6, y: 12 }, { x: 6, y: 11 }, { x: 6, y: 10 }, { x: 6, y: 9 },
  // 11. Left Arm (Left)
  { x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }, { x: 0, y: 8 },
  // 12. Left Turn (Up)
  { x: 0, y: 7 }, { x: 0, y: 6 }
];

// Indices in GLOBAL_PATH where each player starts (Position 0)
export const START_INDICES = {
  [PlayerColor.BLUE]: 0,    // (1,6)
  [PlayerColor.YELLOW]: 13, // (8,1)
  [PlayerColor.GREEN]: 26,  // (13,8)
  [PlayerColor.RED]: 39,    // (6,13)
};

// Home Paths (Final 6 squares into the center)
// The piece enters here after completing 50 squares (reaching position 51)
export const HOME_PATHS = {
  [PlayerColor.BLUE]:   [{ x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }],
  [PlayerColor.YELLOW]: [{ x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 }],
  [PlayerColor.GREEN]:  [{ x: 13, y: 7 }, { x: 12, y: 7 }, { x: 11, y: 7 }, { x: 10, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 7 }],
  [PlayerColor.RED]:    [{ x: 7, y: 13 }, { x: 7, y: 12 }, { x: 7, y: 11 }, { x: 7, y: 10 }, { x: 7, y: 9 }, { x: 7, y: 8 }],
};
