import { Player, Team } from '../participant';
import { EventHandler, Producer } from '../types';
import { DualMetric } from '../utils';
import { Sport } from './enums';
import { StatId } from './utils';

type ConfigTimeouts = {
	qtyPerPhase: Producer<number>;
	isDoneable: Producer<boolean>;
};

type Participants = [playerOne: Player, playerTwo: Player] | [teamOne: Team, teamTwo: Team]; // If dual metric, it fails
export type Config = {
	sport: Sport;
	participants: Participants;
	onChange: EventHandler;
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

export type MethodName = string;
export type WithParticipantOne = boolean;
type Btns = Array<[text: string, MethodName, WithParticipantOne?]>;
export type PanelDefinition = Array<Btns>;