import { getNumber, isArray, isNonNullable } from '.';
import { OneOrMany } from '../types';

export const ensureString = (value: unknown) => isNonNullable(value) ? value.toString() : '';

export const ensureNumber = (value: unknown) => getNumber(value);

export const ensureArray = <T>(value: OneOrMany<T>) => isArray(value) ? value : [value];