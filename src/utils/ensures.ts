import { getNumber, isNonNullable } from '.';

export const ensureString = (value: unknown) => isNonNullable(value) ? value.toString() : '';

export const ensureNumber = (value: unknown) => getNumber(value);