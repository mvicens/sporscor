import { CLASS_NAME_BY_ID } from './consts';

export type Args = Array<any>;

export type Class = new (...args: Args) => unknown;

export type Defined<T = unknown> = T & ({} | null);

export type NonNull<T = unknown> = T & ({} | undefined);

export type Nullable = null | undefined;
export type OrNullable<T> = T | Nullable;

export type OneOrMany<T> = T | Array<T>;

export type Callback<T extends Args, R = void> = (...args: T) => R;
type Provider<T, U extends Args> = Callback<U, T>;
export type Producer<T> = Callback<[], T>;
export type EventHandler<T extends Args = []> = Callback<T>;

type Entry<K, V> = [key: K, value: V];
export type MapIterable<K, V> = Array<Entry<K, V>>;

export type ValueOrProvider<T, U> = T | Provider<T, [U]>;

type ClassNameId = keyof typeof CLASS_NAME_BY_ID;
export type ClassName = OrNullable<ClassNameId>;