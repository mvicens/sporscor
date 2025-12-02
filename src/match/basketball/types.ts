import type { Team } from '../../participant';
import type { Show } from '../../types';

type Qty = Show<number>;
export type Parts = {
	current: Qty;
	total: Qty;
};

export type OpeningBallPossessor = Team;