import { isDefined, isUndefined, upperFirst } from '..';
import { ConsoleMethod } from './types';

const getConsoleLogger = (method: ConsoleMethod) =>
	function (msg: string, styles?: string) {
		msg = upperFirst(msg);
		if (isDefined(styles))
			msg = '%c' + msg;

		const fn = console[method];
		if (isUndefined(styles))
			fn(msg);
		else
			fn(msg, styles);
	};

export const log = getConsoleLogger('log');
export const info = getConsoleLogger('info');
export const warn = getConsoleLogger('warn');
// export const error = getConsoleLogger('error');