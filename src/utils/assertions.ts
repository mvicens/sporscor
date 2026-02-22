import { DeveloperTypeError, isArray, isDefined, isNonNull, isNonNullable, isNumber } from '.';
import type { Class, Defined, NonNull } from '../types';

export function assertIsDefined<T>(value: T): asserts value is Defined<T> {
	if (!isDefined(value))
		throw new DeveloperTypeError(`Expected a defined value, but received: ${value}`);
}

export function assertIsNumber(value: unknown): asserts value is number {
	if (!isNumber(value))
		throw new DeveloperTypeError(`Expected a number, but received: ${value}`);
}

export function assertIsArray(value: unknown): asserts value is Array<unknown> {
	if (!isArray(value))
		throw new DeveloperTypeError(`Expected an array, but received: ${value}`);
}

export function assertIsInstanceOf<T extends Class>(value: unknown, targetClass: T): asserts value is InstanceType<T> {
	if (!(value instanceof targetClass))
		throw new DeveloperTypeError(`Expected an instance of ${targetClass.name}, but received: ${value?.constructor.name ?? typeof value}`);
}

export function assertIsNonNull<T>(value: T): asserts value is NonNull<T> {
	if (!isNonNull(value))
		throw new DeveloperTypeError(`Expected a non-null value, but received: ${value}`);
}

export function assertIsNonNullable<T>(value: T): asserts value is NonNullable<T> {
	if (!isNonNullable(value))
		throw new DeveloperTypeError(`Expected a non-nullable value, but received: ${value}`);
}