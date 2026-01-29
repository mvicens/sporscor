import { CLASS_NAME_BY_ID } from './consts';

export type Show<T> = T & { __show?: never; }; // In order to force visualization in IDE. So that, e.g.:
type Something = Show<string>; // With this…
const something: Something = ''; something; // "Something" displayed instead "string"

export type Args = Array<any>;

// export type Class<T> = new (...args: Args) => T;

export type Index = Show<number>;

export type OneOrMany<T> = T | Array<T>;

export type Callback<T extends Args, U = void> = (...args: T) => U;

type Entry<K, V> = [key: K, value: V];
export type MapIterable<K, V> = Array<Entry<K, V>>;

type Provider<T, U extends Args> = (...args: U) => T;
export type ValueOrProvider<T, U> = T | Provider<T, [U]>;

type EventKey = string | number;
type EventListener<T extends Args> = Callback<T>;
export type EventListenersBy<K extends EventKey, T extends Args> = Partial<Record<K, OneOrMany<EventListener<T>>>>;

export type Msg = Show<string>;

export type Html = Show<string>;

export type TableHeaderScope = 'col' | 'row';

type ClassNameId = keyof typeof CLASS_NAME_BY_ID;
export type ClassName = ClassNameId | null | undefined;