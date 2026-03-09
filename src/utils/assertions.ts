import { DeveloperTypeError, isDefined, isNonNull, isNonNullable, isNumber, isRecord } from '.';
import type { Defined, NonNull } from '../types';

export function assertIsDefined<T>(value: T): asserts value is Defined<T> {
	if (!isDefined(value))
		throw new DeveloperTypeError(`Expected a defined value, but received: ${value}`);
}

export function assertIsRecord(value: unknown): asserts value is Record<PropertyKey, unknown> {
	if (!isRecord(value))
		throw new DeveloperTypeError(`Expected a record, but received: ${value}`);
}

export function assertIsNumber(value: unknown): asserts value is number {
	if (!isNumber(value))
		throw new DeveloperTypeError(`Expected a number, but received: ${value}`);
}

export function assertIsNonNull<T>(value: T): asserts value is NonNull<T> {
	if (!isNonNull(value))
		throw new DeveloperTypeError(`Expected a non-null value, but received: ${value}`);
}

export function assertIsNonNullable<T>(value: T): asserts value is NonNullable<T> {
	if (!isNonNullable(value))
		throw new DeveloperTypeError(`Expected a non-nullable value, but received: ${value}`);
}