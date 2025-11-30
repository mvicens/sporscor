import { NOT_AVAILABLE_ABBR } from '../../consts';
import type { Participant } from '../../participant';
import type { Callback } from '../../types';
import DualMetric from '../dual-metric';
import { DeveloperError } from '../errors';
import { isDefined, isUndefined } from '../guards';
import type { Id } from './enums';
import type { Data, Qty, Value } from './types';

export default class Stats {
	#data: Data = {};

	#get(id: Id, cb: Callback<[Qty], Value>) {
		const qty = this.#data[id];
		return isDefined(qty) ? cb(qty) : NOT_AVAILABLE_ABBR;
	}

	get = (id: Id, participant: Participant) => this.#get(id, qty => qty.getBy(participant));

	getOfOne = (id: Id) => this.#get(id, qty => qty.getOfOne());
	getOfTwo = (id: Id) => this.#get(id, qty => qty.getOfTwo());

	makeAvailable(...list: Array<Id>) {
		list.forEach(item => { this.#data[item] = new DualMetric(0); });
	}

	#set(id: Id, participant: Participant, cb: Callback<[Qty]>) {
		let qty = this.#data[id];
		if (isUndefined(qty))
			throw new DeveloperError('ID not available');

		DualMetric.setFocusedParticipant(participant);
		cb(qty);
	}

	resetOpponent(id: Id, participant: Participant) {
		this.#set(id, participant, qty => { qty.resetOpponent(); });
	}

	increase(id: Id, participant: Participant) {
		this.#set(id, participant, qty => { qty.increment(); });
	}
}