import { MatchConfig } from '..';
import { AnyParticipant } from '../../participant';
import { Callback, ClassName, ValueOrProvider } from '../../types';
import { OnIncrease, ScoreLevelDefinition, ScoreLevelDefinitions, Scorer } from './utils';

type IsOpeningServer = boolean;
type Serve = {
	qtyPerPoint: number;
	getServer: Callback<[Scorer], AnyParticipant | IsOpeningServer>;
};
export type Config =
	& MatchConfig
	& {
		scoreLevelDefinitions: ScoreLevelDefinitions;
		onIncrease: OnIncrease[number];
		serve: Serve;
		className?: ValueOrProvider<ClassName, Scorer>;
	};

type Value = {
	original: number;
	transformed: ReturnType<NonNullable<ScoreLevelDefinition['transformer']>>;
};
export type GetColsCbArg = {
	scoreLevel: (
		& Pick<ScoreLevelDefinition, 'scoreLevel' | 'target'>
		& {
			name: string;
			index?: number;
			isConcluded: boolean;
		}
	);
	values: {
		focused: Value;
		opponent: Value;
	};
};

export type IsColsOfSetsSummarized = boolean;

export type IsServeIndicatorInOwnCol = boolean;

export type ExecuteWithServeInfo = Callback<[server: AnyParticipant, receiver: AnyParticipant, isServerWinner: boolean]>;