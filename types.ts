export enum GameState {
  Start,
  Playing,
  GameOver,
}

export type GameItemType = {
  name: string;
  points: number;
  size: number; // Represents diameter in pixels
  image: string;
};

export type PlacedItem = GameItemType & {
  id: number;
  x: number; // percentage from left
  y: number; // percentage from top
};

export type HookStatus = 'swinging' | 'extending' | 'retracting' | 'scoring';

export type HookState = {
  status: HookStatus;
  angle: number; // in degrees
  length: number;
  caughtItem: PlacedItem | null;
};
