import { Sport } from '../..';
import { Html, ValueOrProvider } from '../../../types';
import { DualMetric } from '../../../utils';
import { Id } from './enums';

export type Value = number;
export type Qty = DualMetric<Value>;
export type Data = Partial<Record<Id, Qty>>;

type Label = Html;
export type LabelById = Partial<Record<Id, ValueOrProvider<Label, Sport>>>;