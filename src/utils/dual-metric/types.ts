import type { AnyParticipant } from '../../participant';
import type { Callback, OrNullable, Show } from '../../types';

export type NumericValue = Show<number>;

export type ParticipantState = 'focused' | 'opponent';
export type ParticipantNumeral = 'one' | 'two';
type ParticipantNumeralByState = Record<ParticipantState, | ParticipantNumeral>;

export type ValueByParticipantNumeral<T> = Record<ParticipantNumeral, T>;
type ParticipantByNumeral = ValueByParticipantNumeral<AnyParticipant>;

export type ParticipantsValues = {
	participantNumeralByState: OrNullable<ParticipantNumeralByState>;
	participantByNumeral: OrNullable<ParticipantByNumeral>;
};

export type VoidCb<T, U> = Callback<[T, U]>;
export type ReturningCb<T> = Callback<[T], boolean>;