import { isFunction } from '.';
import type { ValueOrProvider } from '../types';

export const noop = () => { };
export const identity = <T>(arg: T) => arg;

export const isMemberOf = <T extends object>(name: PropertyKey, receiver: T): name is keyof T => name in receiver;
// export const hasMember = <T extends object>(receiver: T, name: PropertyKey): name is keyof T => name in receiver;

export function pickRandom<T>(...values: Array<T>): T {
	const index = Math.floor(Math.random() * values.length);
	return values[index];
}

export const resolveValueOrProvider = <T, U>(valueOrProvider: ValueOrProvider<T, U>, arg: U) =>
	isFunction(valueOrProvider)
		? valueOrProvider(arg)
		: valueOrProvider;