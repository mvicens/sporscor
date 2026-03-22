import { AnyParticipant } from '../../../participant';
import { MapIterable, ValueOrProvider } from '../../../types';
import { INTERPOLATION_END_SYMBOL, INTERPOLATION_START_SYMBOL, INTERPOLATION_SUFFIX_ONE, INTERPOLATION_SUFFIX_TWO } from './consts';

export type Value = string;

export type InterpolationSuffix = typeof INTERPOLATION_SUFFIX_ONE | typeof INTERPOLATION_SUFFIX_TWO;

export type InterpolationContent = string;

export type Interpolation = `${typeof INTERPOLATION_START_SYMBOL}${InterpolationContent}${typeof INTERPOLATION_END_SYMBOL}`;

type InterpolationId =
	| 'addingToGamesOfSet'
	| 'extraTd'
	| 'extraTh'
	| 'mainClock'
	| 'shotClock';
export type InterpolationDefinitionKey =
	| InterpolationId
	| [InterpolationId, index: number];

type HtmlValueOrProvider = ValueOrProvider<Value, AnyParticipant | undefined>;
export type InterpolationDefinition = MapIterable<InterpolationDefinitionKey, HtmlValueOrProvider>;