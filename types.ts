export enum PlayerColor {
  BLUE = 'BLUE',
  YELLOW = 'YELLOW',
  RED = 'RED',
  GREEN = 'GREEN',
}

export enum PieceState {
  BASE = 'BASE',
  ACTIVE = 'ACTIVE',
  HOME = 'HOME',
}

export interface Piece {
  id: number;
  color: PlayerColor;
  state: PieceState;
  position: number; // 0-51 for main track, 52-57 for home stretch
  travelDistance: number; // Total steps taken (to calculate winning)
}

export interface Player {
  color: PlayerColor;
  pieces: Piece[];
  hasWon: boolean;
}

export interface GameState {
  players: Record<PlayerColor, Player>;
  currentPlayer: PlayerColor;
  diceValue: number | null;
  isDiceRolling: boolean;
  waitingForMove: boolean;
  commentary: string;
  gameLog: string[];
}

export interface Coordinate {
  x: number;
  y: number;
}