import { Participant, ParticipantType, type ParticipantName } from '..';

export default class Player extends Participant {
	constructor(name: ParticipantName) {
		super(ParticipantType.Player, name);

		this._;
	}
	private _ = null; // In order to diff from "Team"
}