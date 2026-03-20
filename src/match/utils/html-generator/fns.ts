import { AnyParticipant } from '../../../participant';
import { isDefined, isString, ParticipantsManagerOfDualMetric } from '../../../utils';
import { INTERPOLATION_END_SYMBOL, INTERPOLATION_SEPARATOR_SYMBOL, INTERPOLATION_START_SYMBOL, INTERPOLATION_SUFFIX_ONE, INTERPOLATION_SUFFIX_TWO } from './consts';
import { Interpolation, InterpolationContent, InterpolationDefinitionKey, InterpolationSuffix } from './types';

const getInterpolationSuffix = (participant: AnyParticipant, participantsManagerOfDualMetric: ParticipantsManagerOfDualMetric): InterpolationSuffix => participantsManagerOfDualMetric.isOne(participant) ? INTERPOLATION_SUFFIX_ONE : INTERPOLATION_SUFFIX_TWO;
function getInterpolationContent(definitionKey: InterpolationDefinitionKey, participantsManagerOfDualMetric: ParticipantsManagerOfDualMetric, participant?: AnyParticipant): InterpolationContent {
	const isId = isString(definitionKey);
	return (isId ? definitionKey : definitionKey.join(INTERPOLATION_SEPARATOR_SYMBOL)) +
		(isDefined(participant) ? INTERPOLATION_SEPARATOR_SYMBOL + getInterpolationSuffix(participant, participantsManagerOfDualMetric) : '');
}

export const getInterpolationFromContent = (content: InterpolationContent): Interpolation => `${INTERPOLATION_START_SYMBOL}${content}${INTERPOLATION_END_SYMBOL}`;

export function getInterpolation(definitionKey: InterpolationDefinitionKey, participantsManagerOfDualMetric: ParticipantsManagerOfDualMetric, participant?: AnyParticipant): Interpolation {
	const content = getInterpolationContent(definitionKey, participantsManagerOfDualMetric, participant);
	return getInterpolationFromContent(content);
}