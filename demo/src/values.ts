import type { SPORTS } from './consts';

export const currentInstance
	: { value: undefined | InstanceType<typeof SPORTS[number]['class']>; }
	= { value: undefined };