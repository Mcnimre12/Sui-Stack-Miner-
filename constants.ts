import type { GameItemType } from './types';

import walrusImg from './assets/walrus.webp';
import sealImg from './assets/seal.webp';
import deepbookImg from './assets/deepbook.webp';
import enokiImg from './assets/enoki.webp';
import suiplayImg from './assets/suiplay.webp';
import suinsImg from './assets/suins.webp';
import nautilusImg from './assets/nautilus.webp';
import slushImg from './assets/slush.webp';

export const GAME_DURATION_SECONDS = 30;
export const TOTAL_ITEMS = 12;

export const ITEM_TYPES: GameItemType[] = [
  { name: 'Walrus', points: 50, size: 40, image: walrusImg },
  { name: 'Seal', points: 45, size: 45, image: sealImg },
  { name: 'Deepbook', points: 35, size: 50, image: deepbookImg },
  { name: 'Enoki', points: 35, size: 50, image: enokiImg },
  { name: 'Suiplay', points: 25, size: 65, image: suiplayImg },
  { name: 'SuiNS', points: 25, size: 60, image: suinsImg },
  { name: 'Nautilus', points: 20, size: 70, image: nautilusImg },
  { name: 'Slush', points: 20, size: 70, image: slushImg },
];

export const HOOK_CONFIG = {
  pivotX: 50, // % from left of game container
  pivotY: 15, // % from top of game container
  baseLength: 40, // pixels
  maxLength: 700, // pixels
  swingAngleRange: 70, // degrees from vertical to each side
  swingSpeed: 0.001, // time multiplier for oscillation
  extendSpeed: 10, // pixels per frame
  baseRetractSpeed: 8, // pixels per frame
};