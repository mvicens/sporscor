import { assertIsNonNullable, assertIsNumber } from '..';
import { AnyParticipant } from '../../participant';
import { Callback } from '../../types';
import { NumericValue, ParticipantNumeral, ParticipantsManager, ParticipantState, ReturningCb, ValueByParticipantNumeral, VoidCb } from './types';

export default class DualMetric<T = NumericValue> {
	constructor(participantsManager: ParticipantsManager, initialValue: T, initialValueOfTwo: T = initialValue) {
		this.#participantsManager = participantsManager;

		this.#initialValues = {
			one: initialValue,
			two: initialValueOfTwo
		};
		this.#values = {
			one: initialValue,
			two: initialValueOfTwo
		};
	}

	#participantsManager: ParticipantsManager;

	#initialValues: ValueByParticipantNumeral<T>;
	#values: ValueByParticipantNumeral<T>;

	getBy(participant: AnyParticipant) {
		this.#participantsManager.verify(participant);
		return this.#values[this.#participantsManager.getNumeralOf(participant)];
	}
	getOpponentBy(participant: AnyParticipant) {
		this.#participantsManager.verify(participant);
		return this.getBy(this.#participantsManager.getOpponentOf(participant));
	}

	#getParticipantByNumeral = (numeral: ParticipantNumeral) => this.#participantsManager.valueByNumeral[numeral];

	#getParticipantBy(state: ParticipantState) {
		const { numeralByState } = this.#participantsManager;
		assertIsNonNullable(numeralByState);
		const participantNumeral = numeralByState[state];

		const participant = this.#getParticipantByNumeral(participantNumeral);
		return participant;
	}
	#getFocusedParticipant = () => this.#getParticipantBy('focused');
	#getOpponentParticipant = () => this.#getParticipantBy('opponent');

	get = () => this.getBy(this.#getFocusedParticipant());
	getOpponent = () => this.getBy(this.#getOpponentParticipant());

	#getOf = (participantNumeral: ParticipantNumeral) => this.getBy(this.#participantsManager.valueByNumeral[participantNumeral]);
	getOfOne = () => this.#getOf('one');
	getOfTwo = () => this.#getOf('two');

	#getValues(): [T, T] {
		const
			valueOfOne = this.getOfOne(),
			valueOfTwo = this.getOfTwo();
		return [valueOfOne, valueOfTwo];
	}

	getAll = this.#getValues;

	#getNumericValues(): [NumericValue, NumericValue] {
		const
			result = this.#getValues(),
			[valueOfOne, valueOfTwo] = result;
		assertIsNumber(valueOfOne);
		assertIsNumber(valueOfTwo);
		return [valueOfOne, valueOfTwo];
	}
	getMax() {
		const [valueOfOne, valueOfTwo] = this.#getNumericValues();
		return Math.max(valueOfOne, valueOfTwo);
	}
	// getMin() {
	// 	const [valueOfOne, valueOfTwo] = this.#getNumericValues();
	// 	return Math.min(valueOfOne, valueOfTwo);
	// }
	getTotal() {
		const [valueOfOne, valueOfTwo] = this.#getNumericValues();
		return valueOfOne + valueOfTwo;
	}

	getParticipantIf(cb: Callback<[T], boolean>) {
		let result: undefined | AnyParticipant;
		this.#forEach((value, participant) => {
			if (cb(value))
				result = participant;
		});
		return result;
	}

	#setBy(participant: AnyParticipant, value: T) {
		this.#participantsManager.verify(participant);
		this.#values[this.#participantsManager.getNumeralOf(participant)] = value;
	}

	set(value: T) {
		this.#setBy(this.#getFocusedParticipant(), value);
	}
	setOpponent(value: T) {
		this.#setBy(this.#getOpponentParticipant(), value);
	}

	#setOf(participantNumeral: ParticipantNumeral, value: T) {
		const participant = this.#participantsManager.valueByNumeral[participantNumeral];
		this.#setBy(participant, value);
	}
	#setOfOne(value: T) {
		this.#setOf('one', value);
	}
	#setOfTwo(value: T) {
		this.#setOf('two', value);
	}

	// #setAll(valueOfOne: T, valueOfTwo: T) {
	// 	this.#setOfOne(valueOfOne);
	// 	this.#setOfTwo(valueOfTwo);
	// }

	#resetBy(participant: AnyParticipant) {
		this.#participantsManager.verify(participant);
		this.#setBy(participant, this.#initialValues[this.#participantsManager.getNumeralOf(participant)]);
	}
	#reset() {
		this.#resetBy(this.#getFocusedParticipant());
	}
	resetOpponent() {
		this.#resetBy(this.#getOpponentParticipant());
	}

	resetAll() {
		this.#reset();
		this.resetOpponent();
	}

	increase() {
		let value = this.get();
		assertIsNumber(value);
		value++;
		this.set(value);
	}

	swap() {
		const
			valueOfOne = this.getOfOne(),
			valueOfTwo = this.getOfTwo();
		this.#setOfOne(valueOfTwo);
		this.#setOfTwo(valueOfOne);
	}

	#isNumberSatisfying(comparedValue: NumericValue, predicate: Callback<[value: NumericValue, comparedValue: NumericValue], boolean>) {
		const value = this.get();
		assertIsNumber(value);
		return predicate(value, comparedValue);
	}

	isLessThan = (comparedValue: NumericValue) => this.#isNumberSatisfying(comparedValue, (value, comparedValue) => value < comparedValue);
	// isEqualTo = (comparedValue: NumericValue) => this.#isNumberSatisfying(comparedValue, (value, comparedValue) => value === comparedValue);
	// isAtLeast = (comparedValue: NumericValue) => this.#isNumberSatisfying(comparedValue, (value, comparedValue) => value >= comparedValue);

	isDiffAtLeast(value: NumericValue) {
		const valueOfOne = this.getOfOne();
		assertIsNumber(valueOfOne);

		const valueOfTwo = this.getOfTwo();
		assertIsNumber(valueOfTwo);

		const diff = Math.abs(valueOfOne - valueOfTwo);
		return diff >= value;
	}

	#forEach(cb: VoidCb<T, AnyParticipant>) {
		this.#getValues().forEach((value, index) => {
			const
				participantNumeral: ParticipantNumeral = index === 0 ? 'one' : 'two',
				participant = this.#getParticipantByNumeral(participantNumeral);
			cb(value, participant);
		});
	}
	every = (cb: ReturningCb<T>) => this.#getValues().every(cb);
	some = (cb: ReturningCb<T>) => this.#getValues().some(cb);

	clone = () => new DualMetric(this.#participantsManager, this.getOfOne(), this.getOfTwo());

	// toString = () => this.#values;
}