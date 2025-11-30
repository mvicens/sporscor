export const TOTAL_OF_SETS = 5;
export const TOTAL_OF_SETS_WHEN_TIE_BREAK = TOTAL_OF_SETS - 1;

export const MIN_TO_WIN_SET = 25;
export const MIN_TO_WIN_TIE_BREAK = 15;

export const TIMEOUTS_PER_SET = 2;
export const TIMEOUTS_PER_TIE_BREAK = 1;

export const POINTS_MAX_TO_GO_TO_REST = [8, 16] as const;
export const POINTS_MAX_TO_GO_TO_REST_IN_TIE_BREAK = [] as const; // None

export const SERVES_PER_POINT = 1;