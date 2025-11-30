import { ScoreLevel } from '../../utils';

export const NAME_BY_SCORE_LEVEL = {
	[ScoreLevel.Game]: 'game',
	[ScoreLevel.Point]: 'point',
	[ScoreLevel.Set]: 'set'
} as const;