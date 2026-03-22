import { ensureString, isNonNullable } from '.';
import { CLASS_NAME_BY_ID } from '../consts';
import { Callback, ClassName } from '../types';

export const getClassNames = (...list: Array<ClassName>) => list
	.filter(isNonNullable)
	.map(id => `ss-${CLASS_NAME_BY_ID[id]}`)
	.join(' ');

export function getLightedElem<T extends number>(
	n: T,
	compared: number,
	transformer: Callback<[T], string> = ensureString
) {
	const className: ClassName =
		n > compared
			? 'highlight'
			: n < compared
				? 'lowlight'
				: null;
	return `<span class="${getClassNames(className)}">${transformer(n)}</span>`;
}