import type { InterpolationDefinition } from './types';

export const INTERPOLATION_START_SYMBOL = '{{';
export const INTERPOLATION_END_SYMBOL = '}}';
export const INTERPOLATION_SEPARATOR_SYMBOL = '.';
export const INTERPOLATION_SUFFIX_ONE = 'one';
export const INTERPOLATION_SUFFIX_TWO = 'two';

export const EMPTY_INTERPOLATION_DEFINITION: InterpolationDefinition = [] as const;