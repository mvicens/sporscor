import { Participant, ParticipantType, type ParticipantName } from '..';

export default class Player extends Participant {
	constructor(name: ParticipantName) {
		super(ParticipantType.Player, name);
	}
}