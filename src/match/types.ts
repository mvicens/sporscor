import { Player, Team } from '../participant';
import type { Show } from '../types';
import { DualMetric } from '../utils';
import type { Sport } from './enums';
import { StatId } from './utils';

type ConfigTimeouts = {
	qtyPerPhase: () => number;
	isDoneable: () => boolean;
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

export type PanelElement = Element; // Cache

type Text = Show<string>;
export type PanelAction = Function;
type Btns = Array<[Text, PanelAction]>;
export type PanelDefinition = Array<Btns>;