import pluralize from 'pluralize';
import type { StatsList } from '..';
import Match, { RestType } from '..';
import { EMPTY_HTML } from '../../consts';
import type { AnyParticipant } from '../../participant';
import type { Callback, ClassName, Html, ValueOrProvider } from '../../types';
import { assertIsDefined, assertIsNumber, DualMetric, getClassNames, getLightedElem, getOrdinal, identity, info, isBoolean, isDefined, isString, isUndefined, noop, resolveValueOrProvider, upperFirst, verifyIsPositiveInteger, warn } from '../../utils';
import { EMPTY_INTERPOLATION_DEFINITION, getInterpolation, StatId } from '../utils';
import type { Config, ExecuteWithServeInfo, GetColsCbArg, IsColsOfSetsSummarized, IsServeIndicatorInOwnCol } from './types';
import { OnIncrement, ScoreLevel, Scorer, SHOULD_CONTINUE_SCORER_LOOP, SHOULD_INTERRUPT_SCORER_LOOP } from './utils';

import './css/index.css';

export default abstract class ScoredMatch extends Match {
	private verifyConfigIsOk(config: Config) {
		verifyIsPositiveInteger(config.serve.qtyPerPoint);
	}
	constructor(private readonly ownConfig: Config) {
		super(ownConfig);

		this.verifyConfigIsOk(ownConfig);

		const onIncrement: OnIncrement = [
			ownConfig.onIncrement,
			{
				[ScoreLevel.Point]: () => { this.resetServes(); },
				[ScoreLevel.Set]: () => { this.goToRest(RestType.breakPerPhase); },
			}
		];
		this.scorer = new Scorer({
			scoreLevelDefinitions: ownConfig.scoreLevelDefinitions,
			participantsManagerOfDualMetric: this.participantsManagerOfDualMetric,
			events: {
				onIncrement,
				onFinish: () => { this.finish(); }
			}
		});

		this.stats.makeAvailable(
			StatId.ConsecutivePointsWon, StatId.MostConsecutivePointsWon,
			StatId.TotalServicePoints,
			StatId.Aces,
			StatId.ServiceErrors
		);
	}

	protected readonly scorer: Scorer;

	private openingServer?: AnyParticipant;

	private getServer() {
		if (isUndefined(this.openingServer))
			return;

		const participantOrIsOpeningServer = this.ownConfig.serve.getServer(this.scorer);

		if (isBoolean(participantOrIsOpeningServer)) {
			const isOpeningServer = participantOrIsOpeningServer;
			return isOpeningServer
				? this.openingServer
				: this.participantsManagerOfDualMetric.getOpponentBy(this.openingServer);
		}

		const participant = participantOrIsOpeningServer;
		return participant;
	}
	protected getReceiver() {
		const server = this.getServer();
		assertIsDefined(server);
		return this.participantsManagerOfDualMetric.getOpponentBy(server);
	}

	private getClassName = () => resolveValueOrProvider(this.ownConfig.className, this.scorer);

	private getCols(cb: Callback<[GetColsCbArg], Html>, isColsOfSetsSummarized: IsColsOfSetsSummarized, participant?: AnyParticipant) {
		let html = EMPTY_HTML;
		const { scorer } = this;
		scorer.forEachScoreLevelDefinition(item => {
			const
				{ scoreLevel } = item,
				isPointScoreLevel = scoreLevel === ScoreLevel.Point;

			if (isPointScoreLevel &&
				(this.isPreparing() || this.isAtBreakPerPhase()))
				return SHOULD_CONTINUE_SCORER_LOOP; // Exit due to last loop

			const isScoreLevelOfSet = scoreLevel === ScoreLevel.Set;

			if (this.isFinished() && !isScoreLevelOfSet)
				return SHOULD_INTERRUPT_SCORER_LOOP;

			const { target } = item;
			function getQty(qty: DualMetric, isOpponent = false) {
				if (isUndefined(participant))
					return NaN;

				const
					{ transformer = identity } = item,
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
				const
					isConcluded = isScoreLevelOfSet && this.wasFinished,
					lastCount = scorer.getLastCountOf(scoreLevel);
				html += cb({
					scoreLevel: {
						scoreLevel,
						target,
						name: pluralize(scoreLevel),
						isConcluded
					},
					values: getValues(lastCount)
				});
			}

			const
				isColsOfSetsDetailed = !isColsOfSetsSummarized,
				isDetailedColOfSetShown = isScoreLevelOfSet && isColsOfSetsDetailed;
			if (isDetailedColOfSetShown)
				scorer.getConcludedDetailedCountsOf(scoreLevel).forEach((qty, i) => {
					html += cb({
						scoreLevel: {
							scoreLevel,
							target,
							name: `${getOrdinal(i + 1)} ${scoreLevel}`,
							index: i,
							isConcluded: true
						},
						values: getValues(qty)
					});
				});

			return SHOULD_CONTINUE_SCORER_LOOP;
		});
		return html;
	}
	private getServeTag(html: ValueOrProvider<Html, Html>, participant?: AnyParticipant) {
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
	private getRow(isColsOfSetsSummarized: IsColsOfSetsSummarized, isServeIndicatorInOwnCol: IsServeIndicatorInOwnCol, participant: AnyParticipant) {
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
						? getInterpolation(['addingToGamesOfSet', index], this.participantsManagerOfDualMetric, participant)
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
				${!this.isFinished() ? getInterpolation('extraTd', this.participantsManagerOfDualMetric, participant) : EMPTY_HTML}
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
				${!this.isFinished() ? getInterpolation('extraTh', this.participantsManagerOfDualMetric) : EMPTY_HTML}
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

	/**
	 * Starts the match to prepare it.
	 */
	public override start(): void { super.start(); }

	private verifyOpeningServerIsAssigned() {
		if (isDefined(this.openingServer))
			throw new Error('The match already has an opening server');
	}
	protected grantOpeningServeTo(participant: AnyParticipant): void {
		this.verifyParticipantIsRegistered(participant);
		this.verifyIsPreparing();

		if (participant === this.openingServer)
			warn(`${upperFirst(participant.getName())} is already the opening server`);
		else {
			this.verifyOpeningServerIsAssigned();

			this.openingServer = participant;
			this.dispatchEvent();
		}
	}

	private verifyOpeningServerIsRequired() {
		if (isUndefined(this.openingServer))
			throw new Error('An opening server is required');
	}
	protected override play(_?: AnyParticipant, execute = noop) {
		super.play(
			_,
			() => {
				this.resetServes();
				execute();
			},
			noop,
			() => {
				this.verifyIsInactive(); // Default verification
				this.verifyOpeningServerIsRequired();
			}
		);
	}

	protected failedServes?: Config['serve']['qtyPerPoint'];
	protected resetServes() { this.failedServes = 0; }

	/**
	 * Logs a serve as fault.
	 */
	public logServeAsFault(): void {
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

	/**
	 * Logs a serve as ace (and the point won by the server).
	 */
	public logServeAsAce(): void {
		this.verifyIsPlaying();

		const server = this.getServer();
		assertIsDefined(server);

		this.stats.increase(StatId.Aces, server);

		this.logPointWonBy(server);
	}

	/**
	 * Logs a point as let.
	 */
	public logPointAsLet(): void {
		this.verifyIsPlaying();

		this.resetServes();
		info('Let point');
	}

	protected logPointWonBy(
		participant: AnyParticipant,
		executeWithServeInfo: ExecuteWithServeInfo = noop, // Before participant focus
		executeAtLast = noop // Focusing p., after scorer increment and before event dispatching
	) {
		this.verifyParticipantIsRegistered(participant);
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

		this.participantsManagerOfDualMetric.focus(participant);
		this.scorer.increment();
		executeAtLast();

		this.dispatchEvent();
	}
}