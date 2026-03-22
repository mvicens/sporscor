import { EMPTY_HTML, NOT_AVAILABLE_ABBR } from '../consts';
import { AnyParticipant, Team } from '../participant';
import { ClassName, Defined, OneOrMany } from '../types';
import { assertIsDefined, assertIsNonNull, assertIsNumber, DeveloperError, DualMetric, ensureArray, ensureNumber, ensureString, getClassNames, getLightedElem, getNumber, getParticipantsManagerOfDualMetric, getPercentage, getRatio, info, isArray, isDefined, isFunction, isMemberOf, isNaN, isString, isUndefined, noop, ParticipantsManagerOfDualMetric, resolveValueOrProvider, upperFirst, warn } from '../utils';
import { RestType, Stage } from './enums';
import { Config, MethodName, PanelDefinition, StatsList, Timeouts, WithParticipantOne } from './types';
import { Cache, CacheId, EMPTY_INTERPOLATION_DEFINITION, HtmlGenerator, LABEL_BY_STAT_ID, StatId, Stats } from './utils';

import './styles/index.css';

export default abstract class Match {
	constructor(private readonly config: Config) {
		validate();

		const
			[participantOne, participantTwo] = config.participants,
			participantsManagerOfDualMetric = getParticipantsManagerOfDualMetric(participantOne, participantTwo);

		this.participantsManagerOfDualMetric = participantsManagerOfDualMetric;

		this.participant = new DualMetric(participantsManagerOfDualMetric, participantOne, participantTwo);

		this.stats = new Stats(participantsManagerOfDualMetric);
		this.stats.makeAvailable(StatId.TotalPoints);

		const { timeouts } = config;
		if (isDefined(timeouts))
			this.timeouts = {
				...timeouts,
				doneQty: new DualMetric(participantsManagerOfDualMetric, 0)
			};

		function validate() {
			const [{ getId: getIdOfOne }, { getId: getIdOfTwo }] = config.participants;
			if (getIdOfOne() === getIdOfTwo())
				throw new Error('Both IDs are the same one');
		}
	}

	protected participantsManagerOfDualMetric: ParticipantsManagerOfDualMetric;

	protected readonly participant: DualMetric<AnyParticipant>;

	protected stage = Stage.Unstarted;

	protected cache = new Cache();

	private isUnstarted = () => this.stage === Stage.Unstarted;
	protected isStarted = () => this.stage !== Stage.Unstarted;
	private isInactive = () => this.isPreparing() || this.isAtRest();
	protected isPreparing = () => this.stage === Stage.Preparing;
	protected isPlaying = () => this.stage === Stage.Playing;
	protected isAtRest = () => this.stage === Stage.AtRest;
	protected isAtBreakPerPhase = () => this.isAtRest() && this.restType === RestType.breakPerPhase;
	protected isInTimeout = () => this.isAtRest() && this.restType === RestType.Timeout;
	protected isFinished = () => this.stage === Stage.Finished;

	protected getParticipantTypeName = () => this.participant.getOfOne().getType();

	private getRootHtml(html: string, classNames: Array<ClassName>, interpolationDefinition = EMPTY_INTERPOLATION_DEFINITION) {
		const htmlGenerator = new HtmlGenerator(html, interpolationDefinition, this.config.sport, classNames);
		return htmlGenerator.get(this.participant.getAll(), this.participantsManagerOfDualMetric);
	}

	/** @return The HTML content. */
	public getScoreboard() { }
	protected getUltimateScoreboard(html: string, className?: ClassName, interpolationDefinition = EMPTY_INTERPOLATION_DEFINITION) {
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

	/** @return The HTML content. */
	public getStats() { }
	protected stats: Stats;
	protected getUltimateStats(statsList: StatsList, className?: ClassName) {
		const
			currentStatsList = [
				StatId.TotalPoints,
				...statsList
			],
			getTh = (scope: 'col' | 'row', className: ClassName, content = EMPTY_HTML) => `<th scope="${scope}" class="${getClassNames(className)}">${content}</th>`;
		let html = this.wasPlayed
			? currentStatsList
				.map(stat => {
					const
						arrayedItem = !isArray(stat) ? ([stat] as [StatId]) : stat, // TODO: Implement "ensureTuple"?
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
							const [pseudonumerator, pseudodenominator] = ensureString(value).split('.');
							assertIsDefined(pseudodenominator);
							const
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

	/**
	 * Gets a control panel to interact by buttons (instead invoke the API methods).
	 * @return The HTML element.
	 */
	public getPanel() { }
	protected getUltimatePanel = (thisArg: this, definition: PanelDefinition) =>
		this.cache.get(CacheId.Panel, () => {
			const methodNames: Array<[MethodName, WithParticipantOne?]> = [];

			let html = definition
				.map(item => {
					const html = item
						.map(([text, method, withParticipantOne]) => {
							methodNames.push([method, withParticipantOne ?? false]);
							return `<button>${upperFirst(text)}</button>`;
						})
						.join('');
					return `<div>${html}</div>`;
				})
				.join('\n');
			html = (
				`<div>
					<h1>Panel</h1>
					${html}
				</div>`
			);
			html = this.getRootHtml(html, ['panel']);

			const
				domParser = new DOMParser(),
				document = domParser.parseFromString(html, 'text/html'),
				result = document.body.firstElementChild;
			assertIsNonNull(result);
			methodNames.forEach(([methodName, withParticipantOne], i) => {
				result.getElementsByTagName('button').item(i)?.addEventListener('click', () => {
					if (isMemberOf(methodName, thisArg)) {
						const fn = thisArg[methodName];
						if (isFunction(fn)) {
							let arg;
							if (isDefined(withParticipantOne))
								arg = withParticipantOne ? this.participant.getOfOne() : this.participant.getOfTwo();
							fn.call(thisArg, arg);
						}
					}
				});
			});
			return result;
		});

	protected verifyParticipantIsRegistered(value: AnyParticipant) { this.participantsManagerOfDualMetric.verify(value, true); }

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

	protected dispatchEvent(cacheIds?: OneOrMany<CacheId>) {
		if (isDefined(cacheIds))
			ensureArray(cacheIds).forEach(cacheId => { this.cache.clear(cacheId); });

		this.config.onChange();
	}

	/** Starts the match to prepare it. */
	protected start(execute = noop) {
		this.verifyIsUnstarted();

		execute();
		this.stage = Stage.Preparing;
		info('The match starts being prepared…');
		this.dispatchEvent();
	}

	protected wasPlayed = false;
	protected play(
		_?: AnyParticipant, // In order to could overwrite method
		execute = noop,
		verifyBefore = noop,
		verifyAfter = () => { this.verifyIsInactive(); },
		cacheIds?: Array<CacheId>
	) {
		verifyBefore();
		verifyAfter();

		this.stage = Stage.Playing;

		execute();

		this.wasPlayed = true;

		this.dispatchEvent(cacheIds);
	}

	protected readonly timeouts?: Timeouts;
	protected resetTimeouts() {
		if (isDefined(this.timeouts))
			this.timeouts.doneQty.resetAll();
	}
	private assertCanHandleTimeouts<T>(value: T): asserts value is Defined<T> {
		const canHandleTimeouts = isDefined(value);
		if (!canHandleTimeouts)
			throw new DeveloperError('Cannot handle timeouts');
	}
	private verifyTimeoutIsDoneable() {
		if (!this.timeouts?.isDoneable())
			throw new Error('The timeout is not doneable');
	}
	private verifyAllTimeoutsAreNotDone(team: Team) {
		const
			{ timeouts } = this,
			isAllDone = timeouts?.doneQty.getBy(team) === timeouts?.qtyPerPhase();
		if (isAllDone)
			throw new Error(`${upperFirst(team.getName())} already did all the timeouts`);
	}
	/**
	 * Grants a timeout to a team.
	 * @param team - The team.
	 */
	protected grantTimeoutTo(team: Team) {
		this.assertCanHandleTimeouts(this.timeouts);

		this.verifyParticipantIsRegistered(team);
		this.verifyIsPlaying();
		this.verifyTimeoutIsDoneable();
		this.verifyAllTimeoutsAreNotDone(team);

		this.participantsManagerOfDualMetric.focus(team);
		this.timeouts.doneQty.increase();

		this.goToRest(RestType.Timeout);
	}

	protected restType?: RestType;
	protected goToRest(type: RestType) {
		this.stage = Stage.AtRest;
		this.restType = type;

		info(
			type !== RestType.Timeout
				? 'The match is at break…'
				: 'The match is in timeout…'
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