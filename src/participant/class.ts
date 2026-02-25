import { Type } from './enums';
import { getNewId } from './fns';
import type { Id, Name } from './types';

export default abstract class Participant {
	constructor(private readonly type: Type, private readonly name: Name) {
		this.id = getNewId();
	}

	private readonly id: Id;

	/**
	 * Gets the participant ID.
	 */
	public getId = (): number => this.id;

	/**
	 * Gets the participant type (player or team).
	 */
	public getType = (): string => this.type;

	/**
	 * Gets the name.
	 */
	public getName = (): string => this.name;
}