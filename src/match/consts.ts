import { ParticipantType } from '../participant';

export const NAME_BY_PARTICIPANT_TYPE = {
	[ParticipantType.Player]: 'player',
	[ParticipantType.Team]: 'team'
} as const;

export const IS_RATIO_STAT_ID = false;
export const IS_PERCENTAGE_STAT_ID = true;