import { DeveloperTypeError, isNonNegativeInteger, isOddNumber, isPositiveInteger } from '.';

export function verifyIsPositiveInteger(n: number) {
	if (!isPositiveInteger(n))
		throw new DeveloperTypeError(`Expected a positive integer, but received: ${n}`);
}
export function verifyIsNonNegativeInteger(n: number) {
	if (!isNonNegativeInteger(n))
		throw new DeveloperTypeError(`Expected a non-negative integer, but received: ${n}`);
}

export function verifyIsOddNumber(n: number) {
	if (!isOddNumber(n))
		throw new DeveloperTypeError(`Expected an odd number but received: ${n}`);
}

export function verifyIsNumberGreaterThan(n: number, min: number) {
	if (!(n > min))
		throw new DeveloperTypeError(`Expected a number greater than ${min}, but received: ${n}`);
}
export function verifyIsNumberLessThan(n: number, max: number) {
	if (!(n < max))
		throw new DeveloperTypeError(`Expected a number less than ${max}, but received: ${n}`);
}