import Scorer from '.';
import { DualMetric } from '..';
import type { Callback, Show, ValueOrProvider } from '../../types';
import type { ScoreLevel } from './enums';

export type ValueOrProviderFromScorer<T> = ValueOrProvider<T, Scorer>;
export type ScoreLevelConfig = {
	scoreLevel: ScoreLevel;
	target: ValueOrProviderFromScorer<number>;
	withLead: ValueOrProviderFromScorer<boolean>;
	transformer?: (qty: number, opponentQty: number, scorer: Scorer) => number | string;
};

export type OnFinish = VoidFunction;

export type IsHigherScoreLevelNew = Show<boolean>;

type DataItem =
	& Required<ScoreLevelConfig>
	& {
		qty: DualMetric;
		detailedQty: Array<DualMetric>;
	};

export type Data = Array<DataItem>;

export type NestedPointsItem = Array<NestedPointsItem> | DualMetric;
export type NestedPoints = Array<NestedPointsItem>;

type ShouldInterrupt = Show<true>;
type ShouldContinue = false | void; // Not interrupt
export type LoopCb = Callback<[DataItem], ShouldInterrupt | ShouldContinue>;