import { Sport } from '../..';
import { EMPTY_HTML } from '../../../consts';
import { AnyParticipant } from '../../../participant';
import { ClassName, Html } from '../../../types';
import { assertIsDefined, getClassNames, isDefined, isNull, ParticipantsManagerOfDualMetric, resolveValueOrProvider } from '../../../utils';
import { INTERPOLATION_END_SYMBOL, INTERPOLATION_START_SYMBOL } from './consts';
import { getInterpolation, getInterpolationFromContent } from './fns';
import { InterpolationContent, InterpolationDefinition } from './types';

export default class HtmlGenerator {
	constructor(html: Html, interpolationDefinition: InterpolationDefinition, sport: Sport, classNames: Array<ClassName>) {
		this.#html = html;
		this.#interpolationDefinition = interpolationDefinition;
		this.#sport = sport;
		this.#classNames = classNames;
	}

	#html: Html;

	#interpolationDefinition: InterpolationDefinition;

	#sport: Sport;

	#classNames: Array<ClassName>;

	get(participants: [AnyParticipant, AnyParticipant], participantsManagerOfDualMetric: ParticipantsManagerOfDualMetric) {
		let html = this.#html;

		this.#interpolationDefinition.forEach(([interpolationDefinitionKey, htmlValueOrProviderByParticipant]) => {
			[
				undefined, // Without interpolation suffix
				...participants
			].forEach(participant => {
				const
					interpolation = getInterpolation(interpolationDefinitionKey, participantsManagerOfDualMetric, participant),
					replaceHtml = resolveValueOrProvider(htmlValueOrProviderByParticipant, participant);
				html = html.replace(interpolation, replaceHtml);
			});
		});

		const interpolationContents: Array<InterpolationContent> = html
			.split(INTERPOLATION_START_SYMBOL)
			.map(str => {
				const
					[interpolationContent, text] = str.split(INTERPOLATION_END_SYMBOL),
					hasInterpolation = isDefined(text);
				if (hasInterpolation) {
					assertIsDefined(interpolationContent);
					return interpolationContent;
				}
				return null;
			})
			.filter(item => !isNull(item));
		interpolationContents.forEach(interpolationContent => {
			const interpolation = getInterpolationFromContent(interpolationContent);
			html = html.replace(interpolation, '');
		});

		if (html === EMPTY_HTML) {
			html = '<!-- No content -->';
			this.#classNames.push('hidden');
		}

		html = (
			`<div data-ss-sport="${this.#sport}" class="${getClassNames('root', ...this.#classNames)}">
				${html}
			</div>`
		);

		html = html.replace(/\t/g, '');

		return html;
	}
}