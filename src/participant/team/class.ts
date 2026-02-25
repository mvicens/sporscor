import { Participant, ParticipantType } from '..';

/**
 * Represents a team to participate in a match.
 */
export default class Team extends Participant {
	/**
	 * Creates a new team.
	 *
	 * @param name - The name.
	 */
	constructor(name: string) {
		super(ParticipantType.Team, name);
	}
}