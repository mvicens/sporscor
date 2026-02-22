import { Type } from './enums';
import { getNewId } from './fns';
import type { Id, Name } from './types';

export default abstract class Participant {
	constructor(private readonly type: Type, private readonly name: Name) {
		this.id = getNewId();
	}

	private readonly id: Id;
	public getId = (): Id => this.id;

	public getType = (): Type => this.type;

	public getName = (): Name => this.name;
}