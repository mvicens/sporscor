import { assertIsDefined, DeveloperError, isDefined } from '..';
import type { AnyParticipant } from '../../participant';
import type { ParticipantNumeral, ParticipantsManager } from './types';

export const getParticipantsManager = (valueOfOne: AnyParticipant, valueOfTwo: AnyParticipant): ParticipantsManager => {
	if (valueOfOne.getId() === valueOfTwo.getId())
		throw new DeveloperError('Both participants are the same one');

	const getOpponentNumeral = (value: ParticipantNumeral): ParticipantNumeral => value === 'one' ? 'two' : 'one';

	return {
		valueByNumeral: {
			one: valueOfOne,
			two: valueOfTwo
		},
		numeralByState: null,
		findNumeral: function (value: AnyParticipant) {
			let numeral: undefined | ParticipantNumeral;
			const id = value.getId();
			Object.entries(this.valueByNumeral).forEach(([searchedParticipantNumeral, { getId }]) => {
				const comparedId = getId();
				if (comparedId === id)
					numeral = searchedParticipantNumeral as ParticipantNumeral;
			});
			return numeral;
		},
		getNumeral: function (value: AnyParticipant) {
			const numeral = this.findNumeral(value);
			assertIsDefined(numeral);
			return numeral;
		},
		getOpponentBy: function (value: AnyParticipant) {
			let numeral = this.getNumeral(value);
			numeral = getOpponentNumeral(numeral);

			value = this.valueByNumeral[numeral];
			return value;
		},
		isOne: function (value: AnyParticipant) { return this.valueByNumeral.one.getId() === value.getId(); },
		verify: function (value: AnyParticipant, withUsualError = false) {
			const
				id = value.getId(),
				isRegistered = Object.values(this.valueByNumeral).some(({ getId }) => {
					const comparedId = getId();
					return comparedId === id;
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
				numeral = this.findNumeral(value),
				isRegistered = isDefined(numeral);

			if (!isRegistered)
				throw new Error('The participant is not registered');

			this.numeralByState = {
				focused: numeral,
				opponent: getOpponentNumeral(numeral)
			};
		}
	};
};