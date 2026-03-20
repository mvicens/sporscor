import { DeveloperError, isNumber, isString, verifyIsPositiveInteger } from '.';
import { Callback } from '../types';

export const isNaN = (n: number) => Number.isNaN(n);

export const isEvenNumber = (n: number) => n % 2 === 0;

export const isOddNumber = (n: number) => !isEvenNumber(n);

export const getNumber = (value: unknown) =>
	isNumber(value)
		? value
		: isString(value)
			? parseFloat(value)
			: NaN;

export function getOrdinal(n: number) {
	verifyIsPositiveInteger(n);

	const
		str = ['th', 'st', 'nd', 'rd'],
		v = n % 100;
	return n + (str[(v - 20) % 10] ?? str[v] ?? str[0] ?? '');
}

function getSuitableValue<T>(
	numerator: number,
	denominator: number,
	cb: Callback<[numerator: number, denominator: number], T>
) {
	if (denominator === 0) {
		if (numerator !== 0)
			throw new DeveloperError('Denominator is 0 but numerator is not');
		return 0;
	}
	return cb(numerator, denominator);
}
export const getPercentage = (numerator: number, denominator: number) => getSuitableValue(numerator, denominator, (n, d) => n / d * 100);
export const getRatio = (numerator: number, denominator: number) => getSuitableValue(numerator, denominator, (n, d) => `${n}/${d}`);

export const padStartNumber = (strN: string, length: number) => strN.padStart(length, '0');