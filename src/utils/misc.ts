import { isFunction } from '.';
import type { ValueOrProvider } from '../types';

export const noop = () => { };
export const identity = <T>(arg: T) => arg;

export function pickRandom<T>(...values: Array<T>): T {
	const index = Math.floor(Math.random() * values.length);
	return values[index];
}

export const resolveValueOrProvider = <T, U>(valueOrProvider: ValueOrProvider<T, U>, arg: U) =>
	isFunction(valueOrProvider)
		? valueOrProvider(arg)
		: valueOrProvider;