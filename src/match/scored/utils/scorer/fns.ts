import { DeveloperTypeError, DualMetric, isInstanceOf } from '../../../../utils';
import { Count, CountHierarchy, CountHierarchyChild } from './types';

export const isCountHierarchy = (value: CountHierarchyChild): value is CountHierarchy => 'summarized' in value;

const isCount = (value: CountHierarchyChild): value is Count => isInstanceOf(value, DualMetric);

export function assertIsCountHierarchy(value: CountHierarchyChild): asserts value is CountHierarchy {
	if (!isCountHierarchy(value))
		throw new DeveloperTypeError(`Expected a count hierarchy, but received: ${value}`);
}

export function assertIsCount(value: CountHierarchyChild): asserts value is Count {
	if (!isCount(value))
		throw new DeveloperTypeError(`Expected a count, but received: ${value}`);
}