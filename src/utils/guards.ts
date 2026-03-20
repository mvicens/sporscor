import { Class, Defined, NonNull, Nullable } from '../types';

export const isString = (value: unknown): value is string => typeof value === 'string';

export const isNumber = (value: unknown): value is number => typeof value === 'number';

export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isTruth = (value: unknown): value is true => value === true;
export const isFalse = (value: unknown): value is false => value === false;

export const isFunction = (value: unknown): value is Function => typeof value === 'function';

export const isArray = (value: unknown): value is Array<unknown> => Array.isArray(value);

export const isRecord = (value: unknown): value is Record<PropertyKey, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export const isInstanceOf = <T extends Class>(value: unknown, targetClass: T): value is InstanceType<T> => value instanceof targetClass;

export const isUndefined = (value: unknown): value is undefined => value === undefined;

export const isNull = <T>(value: T): value is T & null => value === null;
export const isNonNull = <T>(value: T): value is T & NonNull => !isNull(value);

export const isDefined = <T>(value: T): value is Defined<T> => value !== undefined;

const isNullable = <T>(value: T): value is T & Nullable => value === null || value === undefined;
export const isNonNullable = <T>(value: T): value is NonNullable<T> => !isNullable(value);