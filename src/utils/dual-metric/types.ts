import type { AnyParticipant } from '../../participant';
import type { Callback } from '../../types';

export type ParticipantState = 'focused' | 'opponent';
export type ParticipantNumeral = 'one' | 'two';
type ParticipantNumeralByState =
	| undefined
	| Record<ParticipantState, | ParticipantNumeral>;

export type ValueByParticipantNumeral<T> = Record<ParticipantNumeral, T>;
type ParticipantByNumeral =
	| undefined
	| ValueByParticipantNumeral<AnyParticipant>;

export type ParticipantsValues = {
	participantNumeralByState: ParticipantNumeralByState;
	participantByNumeral: ParticipantByNumeral;
};

export type VoidCb<T, U> = Callback<[T, U]>;
export type ReturningCb<T> = Callback<[T], boolean>;