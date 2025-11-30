import { Participant, ParticipantType, type ParticipantName } from '..';

export default class Team extends Participant {
	constructor(name: ParticipantName) {
		super(ParticipantType.Team, name);

		this._;
	}
	private _ = null; // To diff from "Player"
}