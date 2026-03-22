import Scorer from '.';
import { Callback, EventHandler, ValueOrProvider } from '../../../../types';
import { DualMetric, ParticipantsManagerOfDualMetric } from '../../../../utils';
import { ScoreLevel } from './enums';

type ValueOrProviderFromScorer<T> = ValueOrProvider<T, Scorer>;
export type ScoreLevelDefinition = {
	scoreLevel: ScoreLevel;
	target: ValueOrProviderFromScorer<number>;
	shouldWinByTwo: ValueOrProviderFromScorer<boolean>;
	transformer?: Callback<[count: number, opponentCount: number, Scorer], number | string>;
};

export type ScoreLevelDefinitions = [totalOfSets: number, ...Array<ScoreLevelDefinition>];

export type IsHigherScoreLevelAffected = boolean;
type EventHandlerByScoreLevel = Partial<Record<ScoreLevel, EventHandler<[Scorer, IsHigherScoreLevelAffected]>>>;
export type OnIncrease = Array<EventHandlerByScoreLevel>;

export type Config = {
	scoreLevelDefinitions: ScoreLevelDefinitions;
	participantsManagerOfDualMetric: ParticipantsManagerOfDualMetric;
	events: {
		onIncrease: OnIncrease;
		onFinish: EventHandler;
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

type ShouldInterrupt = true;
type ShouldContinue = false; // Could be called "ShouldNotInterrupt"
export type LoopCb<T> = Callback<[T], ShouldInterrupt | ShouldContinue>;