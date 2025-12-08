import Timer from 'easytimer.js';
import type { Html, Show } from '../../../../types';

type Seconds = Show<number>;
export type ExternalItem = {
	id: string;
	initialTime: Seconds;
	decimaledTime?: Seconds;
	onChange: VoidFunction;
	onFinish?: VoidFunction; // If defined, it is countdown
};

type ShouldUpdate = true;
type ShouldNotUpdate = Html; // In order to efficiency (cached content)
export type InternalItem =
	& ExternalItem
	& {
		value: Timer;
		time: ShouldUpdate | ShouldNotUpdate; // To avoid interference from other timers
		shouldShowDecimal: boolean;
		isFinished: boolean;
	};
export type Id = InternalItem['id'];