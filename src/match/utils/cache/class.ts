import { Producer } from '../../../types';
import { Id } from './enums';
import { ValueById } from './types';

export default class Cache {
	#hasDatumById: ValueById<boolean> = {};

	#datumById: ValueById = {};

	get<T>(id: Id, generator: Producer<T>) {
		const hasDatum = this.#hasDatumById[id] ?? false;

		if (hasDatum) {
			const result = this.#datumById[id] as T;
			return result;
		}

		const result = this.#datumById[id] = generator();
		this.#hasDatumById[id] = true;
		return result;
	}

	clear(id: Id) {
		this.#hasDatumById[id] = false;
	}
}