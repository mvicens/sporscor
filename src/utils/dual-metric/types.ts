import type { AnyParticipant } from '../../participant';
import type { Callback, OrNullable, Show } from '../../types';

export type NumericValue = Show<number>;

export type ParticipantNumeral = 'one' | 'two';

export type ValueByParticipantNumeral<T> = Record<ParticipantNumeral, T>;
type ParticipantByNumeral = ValueByParticipantNumeral<AnyParticipant>;

export type ParticipantState = 'focused' | 'opponent';
type ParticipantNumeralByState = Record<ParticipantState, | ParticipantNumeral>;

export type ParticipantsManager = {
	valueByNumeral: ParticipantByNumeral;
	numeralByState: OrNullable<ParticipantNumeralByState>;
	findNumeral: Callback<[participant: AnyParticipant], ParticipantNumeral | undefined>;
	getNumeral: Callback<[participant: AnyParticipant], ParticipantNumeral>;
	getOpponentBy: Callback<[participant: AnyParticipant], AnyParticipant>;
	isOne: Callback<[participant: AnyParticipant], boolean>;
	verify: Callback<[participant: AnyParticipant, withUsualError?: boolean]>;
	focus: Callback<[participant: AnyParticipant]>;
};

export type VoidCb<T, U> = Callback<[T, U]>;
export type ReturningCb<T> = Callback<[T], boolean>;