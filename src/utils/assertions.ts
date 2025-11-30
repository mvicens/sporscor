import { DeveloperTypeError, isArray, isDefined, isNumber } from '.';

export function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
	if (!isDefined(value))
		throw new DeveloperTypeError(`Expected a defined value, but received: ${value}`);
}

export function assertIsNumber(value: unknown): asserts value is number {
	if (!isNumber(value))
		throw new DeveloperTypeError(`Expected a number, but received: ${value}`);
}

// export function assertIsBoolean(value: unknown): asserts value is boolean {
// 	if (!isBoolean(value))
// 		throw new DeveloperTypeError(`Expected a boolean, but received: ${value}`);
// }

export function assertIsArray(value: unknown): asserts value is Array<unknown> {
	if (!isArray(value))
		throw new DeveloperTypeError(`Expected an array, but received: ${value}`);
}

// export function assertIsInstanceOf<T>(value: unknown, targetClass: Class<T>): asserts value is T {
// 	if (!(value instanceof targetClass))
// 		throw new TypeError(`Expected an instance of ${targetClass.name}, but received: ${value?.constructor.name ?? typeof value}`);
// }