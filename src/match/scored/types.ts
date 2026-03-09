import type { MatchConfig } from '..';
import type { AnyParticipant } from '../../participant';
import type { Callback, ClassName, Index, Show, ValueOrProvider } from '../../types';
import { OnIncrement, type ScoreLevelDefinition, ScoreLevelDefinitions, Scorer } from './utils';

type ScorerConfig = {
	scoreLevelDefinitions: ScoreLevelDefinitions;
	onIncrement: OnIncrement[number];
};

type IsOpeningServer = Show<boolean>;
type Serve = {
	qtyPerPoint: number;
	getServer: (scorer: Scorer) => AnyParticipant | IsOpeningServer;
};

export type Config =
	& MatchConfig
	& ScorerConfig
	& {
		serve: Serve;
		className?: ValueOrProvider<ClassName, Scorer>;
	};

type ScoreLevelConfig =
	& Pick<ScoreLevelDefinition, 'scoreLevel' | 'target'>
	& {
		name: string;
		index?: Index;
		isConcluded: boolean;
	};
type Value = {
	original: number;
	transformed: ReturnType<NonNullable<ScoreLevelDefinition['transformer']>>;
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

export type ExecuteWithServeInfo = Callback<[server: AnyParticipant, receiver: AnyParticipant, isServerWinner: boolean]>;