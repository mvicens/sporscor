import Scorer from '.';
import type { Callback, EventListener, Html, Show, ValueOrProvider } from '../../../../types';
import { DualMetric, ParticipantsManagerOfDualMetric } from '../../../../utils';
import { ScoreLevel } from './enums';

type ValueOrProviderFromScorer<T> = ValueOrProvider<T, Scorer>;
export type ScoreLevelDefinition = {
	scoreLevel: ScoreLevel;
	target: ValueOrProviderFromScorer<number>;
	shouldWinByTwo: ValueOrProviderFromScorer<boolean>;
	transformer?: (count: number, opponentCount: number, scorer: Scorer) => number | Html;
};

type TotalOfSets = Show<number>;
export type ScoreLevelDefinitions = [TotalOfSets, ...Array<ScoreLevelDefinition>];

export type IsHigherScoreLevelIncremented = Show<boolean>;
type EventListenerByScoreLevel = Partial<Record<ScoreLevel, EventListener<[Scorer, IsHigherScoreLevelIncremented]>>>;
export type OnIncrement = Array<EventListenerByScoreLevel>;

export type Config = {
	scoreLevelDefinitions: ScoreLevelDefinitions;
	participantsManagerOfDualMetric: ParticipantsManagerOfDualMetric;
	events: {
		onIncrement: OnIncrement;
		onFinish: EventListener;
	};
};

export type DefinitionByScoreLevel = Map<ScoreLevel, ScoreLevelDefinition>;

export type Count = DualMetric;
export type CountHierarchy = {
	summarized: Count; // And concluded
	detailed: Array<CountHierarchyChild>;
};
export type CountHierarchyChild = // Lower score level
	| CountHierarchy // Not point
	| Count; // Point

type ShouldInterrupt = Show<true>;
type ShouldContinue = Show<false>; // Could be called "ShouldNotInterrupt"
export type LoopCb<T> = Callback<[T], ShouldInterrupt | ShouldContinue>;