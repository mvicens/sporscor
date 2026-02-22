import { Sport } from '../..';
import type { Html, Show, ValueOrProvider } from '../../../types';
import { DualMetric } from '../../../utils';
import type { Id } from './enums';

export type Value = Show<number>;
export type Qty = DualMetric<Value>;
export type Data = Partial<Record<Id, Qty>>;

type Label = Html;
export type LabelById = Partial<Record<Id, ValueOrProvider<Label, Sport>>>;