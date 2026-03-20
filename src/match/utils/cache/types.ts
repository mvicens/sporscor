import { Id } from './enums';

export type ValueById<T = unknown> = Partial<Record<Id, T>>;