import { Team } from '../../participant';
import { Qty } from '../../types';

export type Parts = {
	current: Qty;
	total: Qty;
};

export type OpeningBallPossessor = Team;

export type IsSuccessful = boolean;