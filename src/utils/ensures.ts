import { getNumber, isArray, isDefined } from '.';
import type { OneOrMany } from '../types';

export const ensureString = (value: unknown) => isDefined(value) ? value.toString() : '';

export const ensureNumber = (value: unknown) => getNumber(value);

// export const ensureBoolean = (value: unknown) => isBoolean(value) ? value : Boolean(value);

export const ensureArray = <T>(value: OneOrMany<T>) => isArray(value) ? value : [value];