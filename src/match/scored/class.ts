import './css/index.css';

import pluralize from 'pluralize';
import type { StatsList } from '..';
import Match, { RestType } from '..';
import { EMPTY_HTML } from '../../consts';
import { Participant } from '../../participant';
import type { Callback, ClassName, Html, ValueOrProvider } from '../../types';
import { assertIsDefined, assertIsNumber, DualMetric, EMPTY_INTERPOLATION_DEFINITION, ensureArray, getClassNames, getInterpolation, getLightedElem, getOpponentBy, getOrdinal, info, isBoolean, isDefined, isNumber, isString, isUndefined, noop, resolveValueOrProvider, ScoreLevel, Scorer, SHOULD_INTERRUPT_SCORER_LOOP, StatId, upperFirst, verifyIsOddNumber, verifyIsPositiveInteger, warn } from '../../utils';
import { NAME_BY_SCORE_LEVEL } from './consts';
import type { Config, ExecuteWithServeInfo, GetColsCbArg, IsColsOfSetsSummarized, IsServeIndicatorInOwnCol } from './types';

export default class ScoredMatch extends Match {
	#verify(config: Config) {
		config.scoreLevelsConfig.forEach(item => {
			if (!isNumber(item))
				return;

			const totalOfSets = item;
			verifyIsPositiveInteger(totalOfSets);
			verifyIsOddNumber(totalOfSets);
		});
		verifyIsPositiveInteger(config.serve.qtyPerPoint);
	}
	constructor(private ownConfig: Config) {
		super(ownConfig);

		this.#verify(ownConfig);

		const scoreLevelsConfig = ownConfig.scoreLevelsConfig.map(item => {
			if (!isNumber(item))
				return item;

			const
				totalOfSets = item,
				minToWinMatch = (totalOfSets + 1) / 2;
			item = {
				scoreLevel: ScoreLevel.Set,
				target: minToWinMatch,
				withLead: false
			};
			return item;
		});

		const { onNewByScoreLevel = {} } = ownConfig;
		function add(scoreLevel: ScoreLevel, newOnNewScoreLevel: VoidFunction) {
			let oldOnNewScoreLevel = onNewByScoreLevel[scoreLevel] ?? [];
			oldOnNewScoreLevel = ensureArray(oldOnNewScoreLevel);
			oldOnNewScoreLevel.push(newOnNewScoreLevel);

			onNewByScoreLevel[scoreLevel] = oldOnNewScoreLevel;
		}
		add(ScoreLevel.Point, () => { this.resetServes(); });
		add(ScoreLevel.Set, () => { this.goToRest(RestType.breakPerPhase); });

		this.scorer = new Scorer(
			scoreLevelsConfig,
			() => { this.finish(); },
			onNewByScoreLevel
		);

		this.stats.makeAvailable(
			StatId.ConsecutivePointsWon, StatId.MostConsecutivePointsWon,
			StatId.TotalServicePoints,
			StatId.Aces,
			StatId.ServiceErrors
		);
	}

	protected scorer: Scorer;

	private openingServer?: Participant;

	private getServer() {
		if (isUndefined(this.openingServer))
			return undefined;

		const participantOrIsOpeningServer = this.ownConfig.serve.getServer(this.scorer);

		if (isBoolean(participantOrIsOpeningServer)) {
			const isOpeningServer = participantOrIsOpeningServer;
			return isOpeningServer
				? this.openingServer
				: getOpponentBy(this.openingServer);
		}

		const participant = participantOrIsOpeningServer;
		return participant;
	}
	protected getReceiver() {
		const server = this.getServer();
		assertIsDefined(server);
		return getOpponentBy(server);
	}

	private getClassName = () => resolveValueOrProvider(this.ownConfig.className, this.scorer);

	private getCols(cb: Callback<[GetColsCbArg], Html>, isColsOfSetsSummarized: IsColsOfSetsSummarized, participant?: Participant) {
		let html = EMPTY_HTML;
		const { scorer } = this;
		scorer.forReversedEach(dataItem => {
			const
				{ scoreLevel } = dataItem,
				isPointScoreLevel = scoreLevel === ScoreLevel.Point;

			if (isPointScoreLevel &&
				(this.isPreparing() || this.isAtBreakPerPhase()))
				return; // Void due to last loop

			const isScoreLevelOfSet = scoreLevel === ScoreLevel.Set;

			if (this.isFinished() && !isScoreLevelOfSet)
				return SHOULD_INTERRUPT_SCORER_LOOP;

			const
				{ target } = dataItem,
				name = NAME_BY_SCORE_LEVEL[scoreLevel];
			function getQty(qty: DualMetric, isOpponent = false) {
				if (isUndefined(participant))
					return NaN;

				const
					{ transformer } = dataItem,
					focused = qty.getBy(participant),
					opponent = qty.getOpponentBy(participant);
				return isOpponent
					? transformer(opponent, focused, scorer)
					: transformer(focused, opponent, scorer);
			}
			const getValues = (qty: DualMetric) => ({
				focused: {
					original: isDefined(participant) ? qty.getBy(participant) : NaN,
					transformed: getQty(qty)
				},
				opponent: {
					original: isDefined(participant) ? qty.getOpponentBy(participant) : NaN,
					transformed: getQty(qty, true)
				}
			});

			const isSummarizedColShown = !isScoreLevelOfSet || isColsOfSetsSummarized;
			if (isSummarizedColShown) {
				const isConcluded = isScoreLevelOfSet && this.wasFinished;
				html += cb({
					scoreLevel: {
						scoreLevel,
						target,
						name: pluralize(name),
						isConcluded
					},
					values: getValues(dataItem.qty)
				});
			}

			const
				isColsOfSetsDetailed = !isColsOfSetsSummarized,
				isDetailedColOfSetShown = isScoreLevelOfSet && isColsOfSetsDetailed;
			if (isDetailedColOfSetShown)
				dataItem.detailedQty.forEach((qty, i) => {
					html += cb({
						scoreLevel: {
							scoreLevel,
							target,
							name: `${getOrdinal(i + 1)} ${name}`,
							index: i,
							isConcluded: true
						},
						values: getValues(qty)
					});
				});
		});
		return html;
	}
	private getServeTag(html: ValueOrProvider<Html, Html>, participant?: Participant) {
		if (this.isFinished())
			return EMPTY_HTML;

		const server = this.getServer();
		if (isUndefined(server))
			return EMPTY_HTML;

		let indicator = EMPTY_HTML;
		if (isDefined(participant)) {
			const classNames: Array<ClassName> = ['serve'];
			if (participant !== server)
				classNames.push('invisible');
			indicator = `<span class="${getClassNames(...classNames)}"></span>`;
		}

		html = resolveValueOrProvider(html, indicator);
		return html;
	}
	private getRow(isColsOfSetsSummarized: IsColsOfSetsSummarized, isServeIndicatorInOwnCol: IsServeIndicatorInOwnCol, participant: Participant) {
		let html = this.getCols(
			({
				scoreLevel: {
					scoreLevel,
					target: targetOrProvider,
					index,
					isConcluded
				},
				values: {
					focused: {
						original: foValue,
						transformed: ftValue
					},
					opponent: {
						original: ooValue,
						transformed: otValue
					}
				}
			}) => {
				let className: ClassName;
				if (scoreLevel === ScoreLevel.Point &&
					foValue < ooValue) {
					const target = resolveValueOrProvider(targetOrProvider, this.scorer);
					className = target <= ooValue ? 'disadvantaged' : null;
				}

				if (isString(ftValue))
					ftValue = upperFirst(ftValue);
				if (isConcluded) {
					assertIsNumber(ftValue);
					assertIsNumber(otValue);
					ftValue = getLightedElem(ftValue, otValue);
				}

				const interpolation =
					scoreLevel === ScoreLevel.Set && isDefined(index)
						? getInterpolation(['addingToGamesOfSet', index], participant)
						: EMPTY_HTML;

				return `<td class="${getClassNames(className)}"><span class="${getClassNames('content')}">${ftValue}${interpolation}</span></td>`;
			},
			isColsOfSetsSummarized,
			participant
		);
		html = (
			`<tr>
				<th scope="row">
					${!isServeIndicatorInOwnCol ? this.getServeTag(indicator => `<span>${indicator}</span>`, participant) : EMPTY_HTML}
					${upperFirst(participant.getName())}
				</th>
				${html}
				${isServeIndicatorInOwnCol ? this.getServeTag(indicator => `<td>${indicator}</td>`, participant) : EMPTY_HTML}
				${!this.isFinished() ? getInterpolation('extraTd', participant) : EMPTY_HTML}
			</tr>`
		);
		return html;
	}
	protected getDefinedScoreboard = (interpolationDefinition = EMPTY_INTERPOLATION_DEFINITION, isColsOfSetsSummarized: IsColsOfSetsSummarized = false, isServeIndicatorInOwnCol: IsServeIndicatorInOwnCol = false) => this.getUltimateScoreboard(
		`<thead>
			<tr>
				<th scope="col">${upperFirst(this.getParticipantTypeName())}</th>
				${this.getCols(({ scoreLevel: { name } }) => `<th scope="col">${upperFirst(name)}</th>`, isColsOfSetsSummarized)}
				${isServeIndicatorInOwnCol ? this.getServeTag('<th scope="col">Serve</th>') : EMPTY_HTML}
				${!this.isFinished() ? getInterpolation('extraTh') : EMPTY_HTML}
			</tr>
		</thead>
		<tbody>
			${this.ownConfig.participants.map(participant => this.getRow(isColsOfSetsSummarized, isServeIndicatorInOwnCol, participant)).join('')}
		</tbody>`,
		this.getClassName(),
		interpolationDefinition
	);

	protected getDefinedStats = (extraStatsList: StatsList = []) => this.getUltimateStats(
		[
			StatId.MostConsecutivePointsWon,
			StatId.Aces,
			...extraStatsList
		],
		this.getClassName()
	);

	private verifyIsOpeningServerAssigned() {
		if (isDefined(this.openingServer))
			throw new Error('The match already has an opening server');
	}
	public grantOpeningServeTo(participant: Participant) {
		this.verifyIsParticipantRegistered(participant);
		this.verifyIsPreparing();

		if (participant === this.openingServer)
			warn(`${upperFirst(participant.getName())} is already the opening server`);
		else {
			this.verifyIsOpeningServerAssigned();

			this.openingServer = participant;
			this.dispatchEvent();
		}
	}

	private verifyIsOpeningServerRequired() {
		if (isUndefined(this.openingServer))
			throw new Error('An opening server is required');
	}
	protected play(_?: Participant, execute = noop) {
		super.play(
			_,
			() => {
				this.resetServes();
				execute();
			},
			noop,
			() => {
				this.verifyIsInactive(); // Default verification
				this.verifyIsOpeningServerRequired();
			}
		);
	}

	protected failedServes?: Config['serve']['qtyPerPoint'];
	protected resetServes() { this.failedServes = 0; }
	public logServeAsFault() {
		this.verifyIsPlaying();

		assertIsDefined(this.failedServes);
		this.failedServes++;

		if (this.failedServes !== this.ownConfig.serve.qtyPerPoint)
			info('The serve is fault');
		else {
			const server = this.getServer();
			assertIsDefined(server);
			this.stats.increase(StatId.ServiceErrors, server);

			const receiver = this.getReceiver();
			this.logPointWonBy(receiver);

			this.resetServes();
		}

		this.dispatchEvent();
	}
	public logServeAsAce() {
		this.verifyIsPlaying();

		const server = this.getServer();
		assertIsDefined(server);

		this.stats.increase(StatId.Aces, server);

		this.logPointWonBy(server);
	}

	public logPointAsLet() {
		this.verifyIsPlaying();

		this.resetServes();
		info('Let point');
	}

	protected logPointWonBy(
		participant: Participant,
		executeWithServeInfo: ExecuteWithServeInfo = noop, // Before participant focus
		executeAtLast = noop // Focusing p., after scorer increment and before event dispatching
	) {
		this.verifyIsParticipantRegistered(participant);
		this.verifyIsPlaying();

		this.stats.increase(StatId.TotalPoints, participant);

		this.stats.increase(StatId.ConsecutivePointsWon, participant);
		this.stats.resetOpponent(StatId.ConsecutivePointsWon, participant);

		if (this.stats.get(StatId.ConsecutivePointsWon, participant) > this.stats.get(StatId.MostConsecutivePointsWon, participant))
			this.stats.increase(StatId.MostConsecutivePointsWon, participant);

		const server = this.getServer();
		assertIsDefined(server);

		this.stats.increase(StatId.TotalServicePoints, server);

		const
			receiver = this.getReceiver(),
			isServerWinner = server === participant;
		executeWithServeInfo(server, receiver, isServerWinner);

		DualMetric.setFocusedParticipant(participant);
		this.scorer.increment(ScoreLevel.Point);
		executeAtLast();

		this.dispatchEvent();
	}
}