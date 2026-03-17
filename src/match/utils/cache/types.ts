import { Callback, Show } from '../../../types';
import { Id } from './enums';

export type Generator<T> = Callback<[], T>;

export type ValueByName<T = unknown> = Partial<Record<Id, T>>;

export type HasValue = Show<boolean>;