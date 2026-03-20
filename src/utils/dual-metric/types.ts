import { AnyParticipant } from '../../participant';
import { Callback, OrNullable } from '../../types';

export type NumericValue = number;

export type ParticipantNumeral = 'one' | 'two';

export type ValueByParticipantNumeral<T> = Record<ParticipantNumeral, T>;
type ParticipantByNumeral = ValueByParticipantNumeral<AnyParticipant>;

export type ParticipantState = 'focused' | 'opponent';
type ParticipantNumeralByState = Record<ParticipantState, ParticipantNumeral>;

export type ParticipantsManager = {
	valueByNumeral: ParticipantByNumeral;
	numeralByState: OrNullable<ParticipantNumeralByState>;
	findNumeralOf: Callback<[participant: AnyParticipant], ParticipantNumeral | undefined>;
	getNumeralOf: Callback<[participant: AnyParticipant], ParticipantNumeral>;
	getOpponentOf: Callback<[value: AnyParticipant], AnyParticipant>;
	isOne: Callback<[value: AnyParticipant], boolean>;
	verify: Callback<[value: AnyParticipant, withUsualError?: boolean]>;
	focus: Callback<[value: AnyParticipant]>;
};

export type VoidCb<T, U> = Callback<[T, U]>;
export type ReturningCb<T> = Callback<[T], boolean>;