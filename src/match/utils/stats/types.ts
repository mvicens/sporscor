import { Sport } from '../..';
import { ValueOrProvider } from '../../../types';
import { DualMetric } from '../../../utils';
import { Id } from './enums';

export type Qty = DualMetric<number>;
export type Data = Partial<Record<Id, Qty>>;

type Label = string;
export type LabelById = Partial<Record<Id, ValueOrProvider<Label, Sport>>>;