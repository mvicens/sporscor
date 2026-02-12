import { assertIsDefined, DeveloperError } from '..';
import type { AnyParticipant } from '../../participant';
import type { ParticipantNumeral } from './types';
import { participantsValues } from './vars';

export function verifyParticipantIsRegistered(value: AnyParticipant, withUsualError = false) {
	assertIsDefined(participantsValues.participantByNumeral);
	const
		id = value.getId(),
		isParticipantRegistered = Object.values(participantsValues.participantByNumeral).some(({ getId }) => {
			const comparedId = getId();
			return comparedId === id;
		});

	if (!isParticipantRegistered) {
		if (withUsualError)
			throw new Error('The participant is not registered');
		else
			throw new DeveloperError('Participant is not registered');
	}
}

export const getOpponentNumeral = (value: ParticipantNumeral): ParticipantNumeral => value === 'one' ? 'two' : 'one';

export function setValueOfParticipantNumeralByStateProperty(focusedParticipantNumeral: ParticipantNumeral) {
	const
		focused = focusedParticipantNumeral,
		opponent = getOpponentNumeral(focused);
	participantsValues.participantNumeralByState = { focused, opponent };
}

export function getParticipantNumeral(participant: AnyParticipant) {
	let participantNumeral: undefined | ParticipantNumeral;
	const id = participant.getId();
	assertIsDefined(participantsValues.participantByNumeral);
	Object.entries(participantsValues.participantByNumeral).forEach(([searchedParticipantNumeral, { getId }]) => {
		const comparedId = getId();
		if (comparedId === id)
			participantNumeral = searchedParticipantNumeral as ParticipantNumeral;
	});
	assertIsDefined(participantNumeral);
	return participantNumeral;
}

export function getOpponentBy(participant: AnyParticipant) {
	let participantNumeral = getParticipantNumeral(participant);
	participantNumeral = getOpponentNumeral(participantNumeral);

	assertIsDefined(participantsValues.participantByNumeral);
	participant = participantsValues.participantByNumeral[participantNumeral];
	return participant;
}

export function isParticipantOne(participant: AnyParticipant) {
	verifyParticipantIsRegistered(participant);

	assertIsDefined(participantsValues.participantByNumeral);
	return participantsValues.participantByNumeral.one.getId() === participant.getId();
}