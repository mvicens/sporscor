import type { Sport } from '../..';
import { EMPTY_HTML } from '../../../consts';
import type { Participant } from '../../../participant';
import type { ClassName, Html } from '../../../types';
import { getClassNames, isDefined, resolveValueOrProvider } from '../../../utils';
import { ID_BY_SPORT, INTERPOLATION_END_SYMBOL, INTERPOLATION_START_SYMBOL } from './consts';
import { getInterpolation, getInterpolationFromContent } from './fns';
import type { InterpolationContent, InterpolationDefinition } from './types';

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

	get(participants: [Participant, Participant]) {
		let html = this.#html;

		this.#interpolationDefinition.forEach(([interpolationDefinitionKey, htmlValueOrProviderByParticipant]) => {
			[
				undefined, // Without interpolation suffix
				...participants
			].forEach(participant => {
				const
					interpolation = getInterpolation(interpolationDefinitionKey, participant),
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
				return hasInterpolation ? interpolationContent : null;
			})
			.filter(item => isDefined(item));
		interpolationContents.forEach(item => {
			const interpolation = getInterpolationFromContent(item);
			html = html.replace(interpolation, '');
		});

		if (html === EMPTY_HTML) {
			html = '<!-- No content -->';
			this.#classNames.push('hidden');
		}

		const id = ID_BY_SPORT[this.#sport];
		html = (
			`<div data-ss-sport="${id}" class="${getClassNames('root', ...this.#classNames)}">
				${html}
			</div>`
		);

		html = html.replace(/\t/g, '');

		return html;
	}
}