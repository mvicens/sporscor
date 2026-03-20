import { isFunction } from '.';
import { ValueOrProvider } from '../types';

export function noop() { }
export const identity = <T>(arg: T) => arg;

export const isMemberOf = <T extends object>(name: PropertyKey, receiver: T): name is keyof T => name in receiver;

export const resolveValueOrProvider = <T, U>(valueOrProvider: ValueOrProvider<T, U>, arg: U) =>
	isFunction(valueOrProvider)
		? valueOrProvider(arg)
		: valueOrProvider;