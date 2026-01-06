import { assertIsDefined, assertIsNumber, DeveloperError, isUndefined, pickRandom } from '..';
import { Participant } from '../../participant';
import type { Callback } from '../../types';
import { getOpponentBy, getParticipantNumeral, setValueOfParticipantNumeralByStateProperty, verifyParticipantIsRegistered } from './fns';
import type { NumericValue, ParticipantNumeral, ParticipantState, ReturningCb, ValueByParticipantNumeral, VoidCb } from './types';
import { participantsValues } from './vars';

export default class DualMetric<T = NumericValue> {
	static setParticipants(participantOne: Participant, participantTwo: Participant) {
		if (participantOne.getId() === participantTwo.getId())
			throw new DeveloperError('Both participants are the same one');

		participantsValues.participantByNumeral = {
			one: participantOne,
			two: participantTwo
		};

		// To avoid errors at the beginnings when a property of undefined "participantNumeralByState" is accessed
		if (isUndefined(participantsValues.participantNumeralByState)) {
			const focusedParticipantNumeral = pickRandom('one', 'two');
			setValueOfParticipantNumeralByStateProperty(focusedParticipantNumeral);
		}
	}

	static setFocusedParticipant(value: Participant) {
		const focusedParticipantNumeral = getParticipantNumeral(value);
		setValueOfParticipantNumeralByStateProperty(focusedParticipantNumeral);
	}

	constructor(initialValue: T, initialValueOfTwo: T = initialValue) {
		this.#initialValues = {
			one: initialValue,
			two: initialValueOfTwo
		};
		this.#values = {
			one: initialValue,
			two: initialValueOfTwo
		};
	}

	#initialValues: ValueByParticipantNumeral<T>;
	#values: ValueByParticipantNumeral<T>;

	getBy(participant: Participant) {
		verifyParticipantIsRegistered(participant);
		return this.#values[getParticipantNumeral(participant)];
	}
	getOpponentBy(participant: Participant) {
		verifyParticipantIsRegistered(participant);
		return this.getBy(getOpponentBy(participant));
	}

	#getParticipantByNumeral(numeral: ParticipantNumeral) {
		const { participantByNumeral } = participantsValues;
		assertIsDefined(participantByNumeral);
		return participantByNumeral[numeral];
	}

	#getParticipantBy(state: ParticipantState) {
		const { participantNumeralByState } = participantsValues;
		assertIsDefined(participantNumeralByState);
		const participantNumeral = participantNumeralByState[state];

		const participant = this.#getParticipantByNumeral(participantNumeral);
		return participant;
	}
	#getFocusedParticipant = () => this.#getParticipantBy('focused');
	#getOpponentParticipant = () => this.#getParticipantBy('opponent');

	get = () => this.getBy(this.#getFocusedParticipant());
	getOpponent = () => this.getBy(this.#getOpponentParticipant());

	#getOf(participantNumeral: ParticipantNumeral) {
		assertIsDefined(participantsValues.participantByNumeral);
		return this.getBy(participantsValues.participantByNumeral[participantNumeral]);
	}
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
		let result: undefined | Participant;
		this.#forEach((value, participant) => {
			if (cb(value))
				result = participant;
		});
		return result;
	}

	#setBy(participant: Participant, value: T) {
		verifyParticipantIsRegistered(participant);
		this.#values[getParticipantNumeral(participant)] = value;
	}

	set(value: T) {
		this.#setBy(this.#getFocusedParticipant(), value);
	}
	setOpponent(value: T) {
		this.#setBy(this.#getOpponentParticipant(), value);
	}

	#setOf(participantNumeral: ParticipantNumeral, value: T) {
		assertIsDefined(participantsValues.participantByNumeral);
		const participant = participantsValues.participantByNumeral[participantNumeral];

		this.#setBy(participant, value);
	}
	setOfOne(value: T) {
		this.#setOf('one', value);
	}
	setOfTwo(value: T) {
		this.#setOf('two', value);
	}

	// setAll(valueOfOne: T, valueOfTwo: T) {
	// 	this.setOfOne(valueOfOne);
	// 	this.setOfTwo(valueOfTwo);
	// }

	#resetBy(participant: Participant) {
		verifyParticipantIsRegistered(participant);
		this.#setBy(participant, this.#initialValues[getParticipantNumeral(participant)]);
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

	increment() {
		let value = this.get();
		assertIsNumber(value);
		value++;
		this.set(value);
	}

	swap() {
		const
			valueOfOne = this.getOfOne(),
			valueOfTwo = this.getOfTwo();
		this.setOfOne(valueOfTwo);
		this.setOfTwo(valueOfOne);
	}

	#isNumberSatisfying(comparedValue: NumericValue, predicate: (value: NumericValue, comparedValue: NumericValue) => boolean) {
		const value = this.get();
		assertIsNumber(value);
		return predicate(value, comparedValue);
	}

	isLessThan = (comparedValue: NumericValue) => this.#isNumberSatisfying(comparedValue, (value, comparedValue) => value < comparedValue);
	// isEqualTo = (comparedValue: NumericValue) => this.#isNumberSatisfying(comparedValue, (value, comparedValue) => value === comparedValue);
	// isAtLeast = (comparedValue: NumericValue) => this.#isNumberSatisfying(comparedValue, (value, comparedValue) => value >= comparedValue);

	isDiffAtLeast(qty: NumericValue) {
		const valueOfOne = this.getOfOne();
		assertIsNumber(valueOfOne);

		const valueOfTwo = this.getOfTwo();
		assertIsNumber(valueOfTwo);

		const diff = Math.abs(valueOfOne - valueOfTwo);
		return diff >= qty;
	}

	#forEach(cb: VoidCb<T, Participant>) {
		this.#getValues().forEach((value, index) => {
			const
				participantNumeral: ParticipantNumeral = index === 0 ? 'one' : 'two',
				participant = this.#getParticipantByNumeral(participantNumeral);
			cb(value, participant);
		});
	}
	// every = (cb: ReturningCb<T>) => this.#getValues().every(cb);
	some = (cb: ReturningCb<T>) => this.#getValues().some(cb);

	clone = () => new DualMetric(this.getOfOne(), this.getOfTwo());

	// toString = () => this.#values;
}