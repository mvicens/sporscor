import { log } from '.';
import type { Msg } from '../types';

function alert() {
	log('Alert, developer!:', 'font-size: 1.5em; font-weight: bold; color: red;');
}
export class DeveloperError extends Error {
	constructor(msg: Msg) {
		super(msg);
		alert();
	}
}
export class DeveloperTypeError extends TypeError {
	constructor(msg: Msg) {
		super(msg);
		alert();
	}
}