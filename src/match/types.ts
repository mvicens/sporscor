import { Player, Team, type AnyParticipant } from '../participant';
import { DualMetric, StatId } from '../utils';
import type { Sport } from './enums';

type ConfigTimeouts = {
	qtyPerPhase: () => number;
	isDoneable: (participant: AnyParticipant) => boolean;
};

type Participants = [playerOne: Player, playerTwo: Player] | [teamOne: Team, teamTwo: Team]; // If dual metric, it fails
export type Config = {
	sport: Sport;
	participants: Participants;
	onChange: VoidFunction;
	timeouts?: ConfigTimeouts;
};

export type Timeouts =
	& ConfigTimeouts
	& {
		doneQty: DualMetric;
	};

type AbsoluteValue = StatId;
type Ratio = [StatId, StatId, isRatio: false];
type Percentage = [StatId, StatId, isPercentage: true];
export type StatsList = Array<AbsoluteValue | Ratio | Percentage>;