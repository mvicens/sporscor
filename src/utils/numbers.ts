import { isNumber, isString, verifyIsPositiveInteger } from '.';

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
	return n + (str[(v - 20) % 10] || str[v] || str[0]);
}

export function getPercentage(numerator: number, denominator: number) {
	if (numerator === 0 && denominator === 0)
		return 0;
	return numerator / denominator * 100;
}

export function getRatio(numerator: number, denominator: number) {
	if (numerator === 0 && denominator === 0)
		return 0;
	return `${numerator}/${denominator}`;
}

export const padStartNumber = (strN: string, length: number) => strN.padStart(length, '0');