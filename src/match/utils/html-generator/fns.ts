import { Participant } from '../../../participant';
import { isDefined, isParticipantOne, isString } from '../../../utils';
import { INTERPOLATION_END_SYMBOL, INTERPOLATION_SEPARATOR_SYMBOL, INTERPOLATION_START_SYMBOL, INTERPOLATION_SUFFIX_ONE, INTERPOLATION_SUFFIX_TWO } from './consts';
import type { Interpolation, InterpolationContent, InterpolationDefinitionKey, InterpolationSuffix } from './types';

const getInterpolationSuffix = (participant: Participant): InterpolationSuffix => isParticipantOne(participant) ? INTERPOLATION_SUFFIX_ONE : INTERPOLATION_SUFFIX_TWO;
function getInterpolationContent(definitionKey: InterpolationDefinitionKey, participant?: Participant): InterpolationContent {
	const isId = isString(definitionKey);
	return (isId ? definitionKey : definitionKey.join(INTERPOLATION_SEPARATOR_SYMBOL)) +
		(isDefined(participant) ? INTERPOLATION_SEPARATOR_SYMBOL + getInterpolationSuffix(participant) : '');
}
export const getInterpolationFromContent = (content: InterpolationContent): Interpolation => `${INTERPOLATION_START_SYMBOL}${content}${INTERPOLATION_END_SYMBOL}`;
export function getInterpolation(definitionKey: InterpolationDefinitionKey, participant?: Participant): Interpolation {
	const content = getInterpolationContent(definitionKey, participant);
	return getInterpolationFromContent(content);
}