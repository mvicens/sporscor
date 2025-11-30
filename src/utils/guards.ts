export const isString = (value: unknown): value is string => typeof value === 'string';

export const isNumber = (value: unknown): value is number => typeof value === 'number';

export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isTrue = (value: unknown): value is true => value === true;

// export const isObject = (value: unknown): value is object => value !== null && (typeof value === 'object' || typeof value === 'function');

export const isFunction = (value: unknown): value is Function => typeof value === 'function';

export const isArray = (value: unknown): value is Array<unknown> => Array.isArray(value);

// export function isPlainObject(value: unknown): value is PlainObject {
// 	if (typeof value !== 'object' || value === null)
// 		return false;

// 	const prototype = Object.getPrototypeOf(value);
// 	if (prototype !== Object.prototype && prototype !== null)
// 		return false;

// 	return Object.getOwnPropertySymbols(value).length === 0;
// }

// export const isDate = (value: unknown): value is Date => value instanceof Date && !isNaN(value.getTime());

// export const isPromise = <T = unknown>(value: unknown): value is Promise<T> => typeof value === 'object' && value !== null && typeof (value as any).then === 'function';

export const isUndefined = (value: unknown): value is undefined => value === undefined;

// export const isNull = (value: unknown): value is null => value === null;

export const isDefined = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined;