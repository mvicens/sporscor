import type { Team } from '../../participant';
import type { Show } from '../../types';

type PartsQty = Show<number>;
export type Parts = {
	current: PartsQty;
	total: PartsQty;
};

export type OpeningBallPossessor = Team;