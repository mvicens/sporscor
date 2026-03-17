import { Id } from './enums';
import { Generator, HasValue, ValueByName } from './types';

export default class Cache {
	#hasValue: ValueByName<HasValue> = {};

	#data: ValueByName = {};

	get<T>(id: Id, generator: Generator<T>) {
		const hasValue = this.#hasValue[id] ?? false;

		if (hasValue) {
			const result = this.#data[id] as T;
			return result;
		}

		const result = this.#data[id] = generator();
		this.#hasValue[id] = true;
		return result;
	}

	clear(id: Id) {
		this.#hasValue[id] = false;
	}
}