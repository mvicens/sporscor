import { Id } from './types';

let id: Id = 0;
export function getNewId() {
	id++;
	return id;
}