import type { Type } from './enums';
import { getNewId } from './fns';
import type { Id, Name } from './types';

export default class Participant {
	constructor(private type: Type, private name: Name) {
		this.id = getNewId();
	}

	private id: Id;
	public getId = () => this.id;

	public getType = () => this.type;

	public getName = () => this.name;
}