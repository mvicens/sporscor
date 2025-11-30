export const TOTAL_OF_SETS = 3;

export const MIN_TO_WIN_SET = 6;
export const MIN_TO_WIN_GAME = 4;
export const MIN_TO_WIN_TIE_BREAK = 7;

export const TOTAL_GAMES_WHEN_TIE_BREAK = 2 * MIN_TO_WIN_SET;
export const TOTAL_GAMES_WHEN_TIE_BREAK_WON = TOTAL_GAMES_WHEN_TIE_BREAK + 1;

export const POINTS_IN_GAME = [0, 15, 30, 40] as const;
export const ADVANTAGE_SYMBOL = 'Ad';

export const SERVES_PER_POINT = 2;