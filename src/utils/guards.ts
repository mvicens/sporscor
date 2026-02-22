import type { Defined, NonNull, Nullable } from '../types';

export const isString = (value: unknown): value is string => typeof value === 'string';

export const isNumber = (value: unknown): value is number => typeof value === 'number';

export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isTruth = (value: unknown): value is true => value === true;

export const isFunction = (value: unknown): value is Function => typeof value === 'function';

export const isArray = (value: unknown): value is Array<unknown> => Array.isArray(value);

export const isUndefined = (value: unknown): value is undefined => value === undefined;

export const isNull = <T>(value: T): value is T & null => value === null;
export const isNonNull = <T>(value: T): value is T & NonNull => !isNull(value);

export const isDefined = <T>(value: T): value is Defined<T> => value !== undefined;

export const isNullable = <T>(value: T): value is T & Nullable => value === null || value === undefined;
export const isNonNullable = <T>(value: T): value is NonNullable<T> => !isNullable(value);