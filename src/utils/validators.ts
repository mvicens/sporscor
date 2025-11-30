export const isPositiveNumber = (n: number) => n > 0;

const isInteger = (n: number) => Number.isInteger(n);
export const isPositiveInteger = (n: number) => isPositiveNumber(n) && isInteger(n);
export const isNonNegativeInteger = (n: number) => n >= 0 && isInteger(n);