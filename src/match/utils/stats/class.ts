import { NOT_AVAILABLE_ABBR } from '../../../consts';
import type { AnyParticipant } from '../../../participant';
import type { Callback } from '../../../types';
import DualMetric from '../../../utils/dual-metric';
import { DeveloperError } from '../../../utils/errors';
import { isDefined, isUndefined } from '../../../utils/guards';
import type { Id } from './enums';
import type { Data, Qty, Value } from './types';

export default class Stats {
	#data: Data = {};

	#get(id: Id, cb: Callback<[Qty], Value>) {
		const qty = this.#data[id];
		return isDefined(qty) ? cb(qty) : NOT_AVAILABLE_ABBR;
	}

	get = (id: Id, participant: AnyParticipant) => this.#get(id, qty => qty.getBy(participant));

	getOfOne = (id: Id) => this.#get(id, qty => qty.getOfOne());
	getOfTwo = (id: Id) => this.#get(id, qty => qty.getOfTwo());

	makeAvailable(...list: Array<Id>) {
		list.forEach(item => { this.#data[item] = new DualMetric(0); });
	}

	#set(id: Id, participant: AnyParticipant, cb: Callback<[Qty]>) {
		let qty = this.#data[id];
		if (isUndefined(qty))
			throw new DeveloperError('ID not available');

		DualMetric.setFocusedParticipant(participant);
		cb(qty);
	}

	resetOpponent(id: Id, participant: AnyParticipant) {
		this.#set(id, participant, qty => { qty.resetOpponent(); });
	}

	increase(id: Id, participant: AnyParticipant) {
		this.#set(id, participant, qty => { qty.increment(); });
	}
}