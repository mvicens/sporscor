import { SPORTS } from './consts';

type Nullable = null | undefined;
type OrNullable<T> = T | Nullable;

type Value = InstanceType<typeof SPORTS[number]['class']>;
export type CurrentInstance = { value: OrNullable<Value>; };