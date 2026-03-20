import Timer from 'easytimer.js';
import { EventHandler, Html } from '../../../../types';

type Seconds = number;
export type ExternalItem = {
	id: string;
	initialTime: Seconds;
	decimaledTime?: Seconds;
	onChange: EventHandler;
	onFinish?: EventHandler; // If defined, it is countdown
};

type ShouldUpdate = true;
type ShouldNotUpdate = Html; // In order to efficiency (cached content)
export type InternalItem =
	& ExternalItem
	& {
		value: Timer;
		time: ShouldUpdate | ShouldNotUpdate; // In order to avoid interference from other timers
		shouldShowDecimal: boolean;
		isFinished: boolean;
	};
export type Id = InternalItem['id'];