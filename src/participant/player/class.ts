import { Participant, ParticipantType } from '..';

/** Represents a player to participate in a match. */
export default class Player extends Participant {
	/**
	 * Creates a player.
	 * @param name - The name.
	 */
	constructor(name: string) {
		super(ParticipantType.Player, name);

		this._;
	}

	private _ = null; // In order to diff from "Team"
}