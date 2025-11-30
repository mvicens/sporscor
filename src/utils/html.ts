import { ensureString, isDefined } from '.';
import { CLASS_NAME_BY_ID } from '../consts';
import type { Callback, ClassName, Html } from '../types';

export const getClassNames = (...list: Array<ClassName>) => list
	.filter(isDefined)
	.map(item => `ss-${CLASS_NAME_BY_ID[item]}`)
	.join(' ');

export function getLightedElem<T extends number>(
	n: T,
	compared: number,
	transformer: Callback<[T], Html> = ensureString
): Html {
	const className: ClassName =
		n > compared
			? 'highlight'
			: n < compared
				? 'lowlight'
				: null;
	return `<span class="${getClassNames(className)}">${transformer(n)}</span>`;
}