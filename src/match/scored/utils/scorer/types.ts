import Scorer from '.';
import type { Callback, Html, Show, ValueOrProvider } from '../../../../types';
import { DualMetric } from '../../../../utils';
import type { ScoreLevel } from './enums';

export type ValueOrProviderFromScorer<T> = ValueOrProvider<T, Scorer>;
export type ScoreLevelConfig = {
	scoreLevel: ScoreLevel;
	target: ValueOrProviderFromScorer<number>;
	withLead: ValueOrProviderFromScorer<boolean>;
	transformer?: (qty: number, opponentQty: number, scorer: Scorer) => number | Html;
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
type ShouldContinue = false | void; // Could be called "ShouldNotInterrupt"
export type LoopCb = Callback<[DataItem], ShouldInterrupt | ShouldContinue>;