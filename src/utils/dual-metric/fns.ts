import { assertIsDefined, DeveloperError, isDefined } from '..';
import { AnyParticipant } from '../../participant';
import { ParticipantNumeral, ParticipantsManager } from './types';

export function getParticipantsManager(valueOfOne: AnyParticipant, valueOfTwo: AnyParticipant): ParticipantsManager {
	validate();

	const getOpponentNumeral = (value: ParticipantNumeral): ParticipantNumeral => value === 'one' ? 'two' : 'one';

	return {
		valueByNumeral: {
			one: valueOfOne,
			two: valueOfTwo
		},
		numeralByState: null,
		findNumeralOf: function (participant: AnyParticipant) {
			let numeral: undefined | ParticipantNumeral;
			const id = participant.getId();
			Object.entries(this.valueByNumeral).forEach(([currentNumeral, { getId }]) => {
				const currentId = getId();
				if (currentId === id)
					numeral = currentNumeral as ParticipantNumeral;
			});
			return numeral;
		},
		getNumeralOf: function (participant: AnyParticipant) {
			const numeral = this.findNumeralOf(participant);
			assertIsDefined(numeral);
			return numeral;
		},
		getOpponentOf: function (value: AnyParticipant) {
			let numeral = this.getNumeralOf(value);
			numeral = getOpponentNumeral(numeral);

			value = this.valueByNumeral[numeral];
			return value;
		},
		isOne: function (value: AnyParticipant) { return this.valueByNumeral.one.getId() === value.getId(); },
		verify: function (value: AnyParticipant, withUsualError = false) {
			const
				id = value.getId(),
				isRegistered = Object.values(this.valueByNumeral).some(({ getId }) => {
					const currentId = getId();
					return currentId === id;
				});
			if (!isRegistered) {
				if (withUsualError)
					throw new Error('The participant is not registered');
				else
					throw new DeveloperError('Participant is not registered');

			}
		},
		focus: function (value: AnyParticipant) {
			const
				numeral = this.findNumeralOf(value),
				isRegistered = isDefined(numeral);

			if (!isRegistered)
				throw new Error('The participant is not registered');

			this.numeralByState = {
				focused: numeral,
				opponent: getOpponentNumeral(numeral)
			};
		}
	};

	function validate() {
		if (valueOfOne.getId() === valueOfTwo.getId())
			throw new DeveloperError('Both participants are the same one');
	}
}