import { type AnyParticipant } from '../../../participant';
import type { Html, Index, MapIterable, Show, ValueOrProvider } from '../../../types';
import { INTERPOLATION_END_SYMBOL, INTERPOLATION_START_SYMBOL, INTERPOLATION_SUFFIX_ONE, INTERPOLATION_SUFFIX_TWO } from './consts';

export type InterpolationSuffix = typeof INTERPOLATION_SUFFIX_ONE | typeof INTERPOLATION_SUFFIX_TWO;

export type InterpolationContent = Show<string>;

export type Interpolation = `${typeof INTERPOLATION_START_SYMBOL}${InterpolationContent}${typeof INTERPOLATION_END_SYMBOL}`;

type InterpolationId =
	| 'addingToGamesOfSet'
	| 'extraTd'
	| 'extraTh';
export type InterpolationDefinitionKey =
	| InterpolationId
	| [InterpolationId, Index];

type HtmlValueOrProvider = ValueOrProvider<Html, AnyParticipant | undefined>;
export type InterpolationDefinition = MapIterable<InterpolationDefinitionKey, HtmlValueOrProvider>;