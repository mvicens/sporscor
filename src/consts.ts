import type { Html } from './types';

export const NOT_AVAILABLE_ABBR = 'N/A';

export const EMPTY_HTML: Html = '';

export const CLASS_NAME_BY_ID = {
	content: 'content',
	disadvantaged: 'disadvantaged',
	hidden: 'hidden',
	highlight: 'highlight',
	invisible: 'invisible',
	isInTieBreak: 'is-in-tie-break',
	labelLeft: 'label-left',
	labelRight: 'label-right',
	lowlight: 'lowlight',
	root: 'root',
	scoreboard: 'scoreboard',
	serve: 'serve',
	stats: 'stats'
} as const;