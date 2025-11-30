import type { MatchConfig } from '..';
import { Participant } from '../../participant';
import type { Callback, ClassName, EventListenersBy, Index, Show } from '../../types';
import { ScoreLevel, Scorer, type IsHigherScoreLevelNew, type ScoreLevelConfigOfScorer, type ValueOrProviderFromScorer } from '../../utils';

type IsOpeningServer = Show<boolean>;
type Serve = {
	qtyPerPoint: number;
	getServer: (scorer: Scorer) => Participant | IsOpeningServer;
};

export type OnNewByScoreLevel = EventListenersBy<ScoreLevel, [Scorer, IsHigherScoreLevelNew]>; // Technically named "EventListenersByScoreLevel"

type ScoreLevelsConfig = Array<ScoreLevelConfigOfScorer>;
type TotalOfSets = Show<number>;
export type Config =
	& MatchConfig
	& {
		scoreLevelsConfig: [...ScoreLevelsConfig, TotalOfSets];
		serve: Serve;
		onNewByScoreLevel: OnNewByScoreLevel;
		className?: ValueOrProviderFromScorer<ClassName>;
	};

type ScoreLevelConfig =
	& Pick<ScoreLevelConfigOfScorer, 'scoreLevel' | 'target'>
	& {
		name: string;
		index?: Index;
		isConcluded: boolean;
	};
type Value = {
	original: number;
	transformed: number | string;
};
export type GetColsCbArg = {
	scoreLevel: ScoreLevelConfig;
	values: {
		focused: Value;
		opponent: Value;
	};
};

export type IsColsOfSetsSummarized = Show<boolean>;

export type IsServeIndicatorInOwnCol = Show<boolean>;

export type ExecuteWithServeInfo = Callback<[server: Participant, receiver: Participant, isServerWinner: boolean]>;