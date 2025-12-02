import { EMPTY_HTML, NOT_AVAILABLE_ABBR } from '../consts';
import { Participant, Team } from '../participant';
import type { ClassName, Html, TableHeaderScope } from '../types';
import { assertIsDefined, assertIsNumber, DeveloperError, DualMetric, EMPTY_INTERPOLATION_DEFINITION, ensureNumber, ensureString, getClassNames, getLightedElem, getNumber, getPercentage, getRatio, HtmlGenerator, info, isArray, isDefined, isNaN, isString, isUndefined, LABEL_BY_STAT_ID, noop, resolveValueOrProvider, StatId, Stats, upperFirst, verifyIsParticipantRegisteredInDualMetric, warn } from '../utils';
import { NAME_BY_PARTICIPANT_TYPE } from './consts';
import { RestType, Stage } from './enums';
import type { Config, StatsList, Timeouts } from './types';

import './css/index.css';

export default class Match {
	#verify(participantOne: Participant, participantTwo: Participant) {
		if (participantOne.getId() === participantTwo.getId())
			throw new Error('Both participants are the same one');
	}
	constructor(private config: Config) {
		const [participantOne, participantTwo] = config.participants;

		this.#verify(participantOne, participantTwo);

		DualMetric.setParticipants(participantOne, participantTwo);

		this.participant = new DualMetric(participantOne, participantTwo);

		this.stats.makeAvailable(StatId.TotalPoints);

		let { timeouts } = config;
		if (isDefined(timeouts))
			this.timeouts = {
				...timeouts,
				doneQty: new DualMetric(0)
			};
	}

	protected participant: DualMetric<Participant>;

	protected stage = Stage.Unstarted;

	private isUnstarted = () => this.stage === Stage.Unstarted;
	protected isStarted = () => this.stage !== Stage.Unstarted;
	private isInactive = () => this.isPreparing() || this.isAtRest();
	protected isPreparing = () => this.stage === Stage.Preparing;
	protected isPlaying = () => this.stage === Stage.Playing;
	protected isAtRest = () => this.stage === Stage.AtRest;
	protected isAtBreakPerPhase = () => this.isAtRest() && this.restType === RestType.breakPerPhase;
	protected isInTimeout = () => this.isAtRest() && this.restType === RestType.Timeout;
	protected isFinished = () => this.stage === Stage.Finished;

	protected getParticipantTypeName = () => NAME_BY_PARTICIPANT_TYPE[this.participant.getOfOne().getType()];

	private getRootHtml(html: Html, classNames: Array<ClassName>, interpolationDefinition = EMPTY_INTERPOLATION_DEFINITION) {
		const htmlGenerator = new HtmlGenerator(html, interpolationDefinition, this.config.sport, classNames);
		return htmlGenerator.get(this.participant.getAll());
	}

	protected getUltimateScoreboard(html: Html, className?: ClassName, interpolationDefinition = EMPTY_INTERPOLATION_DEFINITION) {
		if (this.isUnstarted()) {
			html = EMPTY_HTML;
			warn('No scoreboard content');
		} else
			html = (
				`<table>
					<caption>Scoreboard</caption>
					${html}
				</table>`
			);
		return this.getRootHtml(html, ['scoreboard', className], interpolationDefinition);
	}

	protected stats = new Stats();
	protected getUltimateStats(statsList: StatsList, className?: ClassName) {
		const
			ultimateStatsList = [
				StatId.TotalPoints,
				...statsList
			],
			getTh = (scope: TableHeaderScope, className: ClassName, content = EMPTY_HTML) => `<th scope="${scope}" class="${getClassNames(className)}">${content}</th>`;
		let html: Html = this.wasPlayed
			? ultimateStatsList
				.map(item => {
					const
						arrayedItem = !isArray(item) ? ([item] as [StatId]) : item, // TODO: Implement "ensureTuple"?
						[statId, secondaryStatId, isPercentage] = arrayedItem;

					const label = resolveValueOrProvider(LABEL_BY_STAT_ID[statId], this.config.sport);
					assertIsDefined(label);

					const
						isAbsoluteValue = isUndefined(secondaryStatId),
						getValue = (fn: Stats['getOfOne'] | Stats['getOfTwo']) => {
							const value = fn(statId);
							if (isAbsoluteValue)
								return value;
							else {
								if (isString(value))
									return value;

								const secondaryValue = fn(secondaryStatId);
								assertIsNumber(secondaryValue);

								if (isPercentage) {
									const roundedPercentage = Math.round(getPercentage(value, secondaryValue));
									return roundedPercentage;
								} else // Ratio
									return getNumber(`${value}.${secondaryValue}1`);
							}
						},
						valueOfOne = getValue(this.stats.getOfOne),
						valueOfTwo = getValue(this.stats.getOfTwo);

					const
						getNumValue = (value: typeof valueOfOne) => value === NOT_AVAILABLE_ABBR ? NaN : value,
						numValueOfOne = getNumValue(valueOfOne),
						numValueOfTwo = getNumValue(valueOfTwo),
						getHtml = (value: typeof numValueOfOne) => {
							if (isPercentage)
								return `${value}%`;

							// Ratio
							const
								[pseudonumerator, pseudodenominator] = ensureString(value).split('.'),
								numerator = ensureNumber(pseudonumerator),
								denominator = ensureNumber(pseudodenominator.substring(0, pseudodenominator.length - 1)),
								ratio = getRatio(numerator, denominator);
							return ensureString(ratio);
						},
						transformer = (value: typeof numValueOfOne) => isNaN(value)
							? NOT_AVAILABLE_ABBR
							: isAbsoluteValue
								? ensureString(value)
								: getHtml(value);
					return (
						`<tr>
							${getTh('row', 'labelLeft', upperFirst(label))}
							<td>${getLightedElem(numValueOfOne, numValueOfTwo, transformer)}</td>
							${getTh('row', 'labelRight', upperFirst(label))}
							<td>${getLightedElem(numValueOfTwo, numValueOfOne, transformer)}</td>
						</tr>`
					);
				})
				.join('\n')
			: EMPTY_HTML;
		if (html === EMPTY_HTML)
			warn('No stats content');
		else
			html = (
				`<table>
					<caption>Stats</caption>
					<thead>
						<tr>
							${getTh('col', 'labelLeft')}
							<th scope="col">${upperFirst(this.participant.getOfOne().getName())}</th>
							${getTh('col', 'labelRight')}
							<th scope="col">${upperFirst(this.participant.getOfTwo().getName())}</th>
						</tr>
					</thead>
					<tbody>
						${html}
					</tbody>
				</table>`
			);
		return this.getRootHtml(html, ['stats', className]);
	}

	protected verifyIsParticipantRegistered(participant: Participant) { verifyIsParticipantRegisteredInDualMetric(participant, true); }

	private verifyIsUnstarted() {
		if (!this.isUnstarted())
			throw new Error('The match is not unstarted');
	}
	protected verifyIsStarted() {
		if (!this.isStarted())
			throw new Error('The match is not started');
	}
	protected verifyIsInactive() {
		if (!this.isInactive())
			throw new Error('The match is not inactive');
	}
	protected verifyIsPreparing() {
		if (!this.isPreparing())
			throw new Error('The match is not being prepared');
	}
	protected verifyIsPlaying() {
		if (!this.isPlaying())
			throw new Error('The match is not being played');
	}
	protected verifyIsAtBreakPerPhase(phaseName: string) {
		if (!this.isAtRest() || this.restType !== RestType.breakPerPhase)
			throw new Error(`The match is not at ${phaseName} break`);
	}

	protected dispatchEvent() { this.config.onChange(); }

	public start(execute = noop) {
		this.verifyIsUnstarted();

		execute();
		this.stage = Stage.Preparing;
		info('The match starts being prepared...');
		this.dispatchEvent();
	}

	protected wasPlayed = false;
	protected play(
		_?: Participant, // To successfully overwrite method
		execute = noop,
		verifyBefore = noop,
		verifyAfter = () => { this.verifyIsInactive(); }
	) {
		verifyBefore();
		verifyAfter();

		this.stage = Stage.Playing;

		execute();

		this.wasPlayed = true;

		this.dispatchEvent();
	}

	protected timeouts?: Timeouts;
	protected resetTimeouts() {
		if (isDefined(this.timeouts))
			this.timeouts.doneQty.resetAll();
	}
	private assertIsTimeoutsHandleable<T>(value: T): asserts value is NonNullable<T> {
		const canHandleTimeouts = isDefined(value);
		if (!canHandleTimeouts)
			throw new DeveloperError('Cannot handle timeouts');
	}
	private verifyIsTimeoutDoneable(team: Team) {
		if (!this.timeouts?.isDoneable(team))
			throw new Error('The timeout is not doneable');
	}
	private verifyIsAllTimeoutsDone(team: Team) {
		const
			{ timeouts } = this,
			isAllDone = timeouts?.doneQty.getBy(team) === timeouts?.qtyPerPhase();
		if (isAllDone)
			throw new Error(`${upperFirst(team.getName())} already done all the timeouts`);
	}
	public grantTimeoutTo(team: Team) {
		this.assertIsTimeoutsHandleable(this.timeouts);

		this.verifyIsParticipantRegistered(team);
		this.verifyIsPlaying();
		this.verifyIsTimeoutDoneable(team);
		this.verifyIsAllTimeoutsDone(team);

		DualMetric.setFocusedParticipant(team);
		this.timeouts.doneQty.increment();

		this.goToRest(RestType.Timeout);
	}

	protected restType?: RestType;
	protected goToRest(type: RestType) {
		this.stage = Stage.AtRest;
		this.restType = type;

		info(
			type !== RestType.Timeout
				? 'The match is at break...'
				: 'The match is in timeout...'
		);

		this.dispatchEvent();
	}

	protected wasFinished = false;
	protected finish() {
		this.stage = Stage.Finished;
		this.wasFinished = true;
		this.dispatchEvent();
	}
}