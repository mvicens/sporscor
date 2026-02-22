import { assertIsDefined, isFunction } from '.';
import type { ValueOrProvider } from '../types';

export const noop = () => { };
export const identity = <T>(arg: T) => arg;

export const isMemberOf = <T extends object>(name: PropertyKey, receiver: T): name is keyof T => name in receiver;

export function pickRandom<T>(...values: Array<T>): T {
	const
		index = Math.floor(Math.random() * values.length),
		result = values.at(index);
	assertIsDefined(result);
	return result;
}

export const resolveValueOrProvider = <T, U>(valueOrProvider: ValueOrProvider<T, U>, arg: U) =>
	isFunction(valueOrProvider)
		? valueOrProvider(arg)
		: valueOrProvider;

export function split(value: string, separator: string) {
	const result: Array<string | undefined> = value.split(separator);
	return result;
}