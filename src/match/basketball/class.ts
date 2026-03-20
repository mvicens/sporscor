import Match, { IS_PERCENTAGE_STAT_ID, MatchStage, RestType, Sport } from '..';
import { EMPTY_HTML } from '../../consts';
import { Team } from '../../participant';
import { Qty } from '../../types';
import { assertIsDefined, DualMetric, getClassNames, getOrdinal, info, isDefined, isTruth, noop, upperFirst, warn } from '../../utils';
import { CacheId, getInterpolation, InterpolationDefinition, StatId } from '../utils';
import { DECIMALED_MINUTES, DECIMALED_SHOT_CLOCK_SECONDS, FREE_THROWS_BY_FOUL_WHEN_FAILED_FIELD_BASKET, FREE_THROWS_BY_UNSPORTSMANLIKE_OR_DISQUALIFYING_FOUL, INITIAL_MINUTES, INITIAL_SHOT_CLOCK_SECONDS, LAST_PART_OF_FIRST_HALF, MAIN_CLOCK_ID, PARTS, SHOT_CLOCK_ID, TIMEOUTS_PER_FIRST_HALF, TIMEOUTS_PER_SECOND_HALF } from './consts';
import { IsSuccessful, OpeningBallPossessor, Parts } from './types';
import { Timer, TimerId, TimerItem } from './utils';

/** Represents a basketball match. */
export default class BasketballMatch extends Match {
	/**
	 * Creates a basketball match.
	 * @param teamOne - The 1st team to participate.
	 * @param teamTwo - The 2nd team to participate.
	 * @param onChange - A callback called when the scoreboard and/or statistics change.
	 */
	constructor(teamOne: Team, teamTwo: Team, onChange: VoidFunction) {
		super({
			sport: Sport.Basketball,
			participants: [teamOne, teamTwo],
			onChange,
			timeouts: {
				qtyPerPhase: () => this.parts.current <= LAST_PART_OF_FIRST_HALF ? TIMEOUTS_PER_FIRST_HALF : TIMEOUTS_PER_SECOND_HALF,
				isDoneable: () => this.isPaused()
			}
		});

		const
			dispatchEvent = (cacheId: CacheId) => {
				if (this.isStarted())
					this.dispatchEvent(cacheId);
			},
			items: Array<TimerItem> = [
				{
					id: MAIN_CLOCK_ID,
					initialTime: INITIAL_MINUTES * 60,
					decimaledTime: DECIMALED_MINUTES * 60,
					onChange: () => { dispatchEvent(CacheId.MainClock); },
					onFinish: () => { this.finishPart(); }
				},
				{
					id: SHOT_CLOCK_ID,
					initialTime: INITIAL_SHOT_CLOCK_SECONDS,
					decimaledTime: DECIMALED_SHOT_CLOCK_SECONDS,
					onChange: () => { dispatchEvent(CacheId.ShotClock); },
					onFinish: () => {
						this._pause(() => {
							info('The shot clock is over');

							this.switchBallPossession();
							this.shouldResetShotClock = true;
						});
					}
				}
			];
		this.timer = new Timer(items);

		this.parts = {
			current: 1,
			total: PARTS
		};

		this.stats.makeAvailable(
			StatId.TwoPointersAttempted, StatId.TwoPointersMade,
			StatId.ThreePointersAttempted, StatId.ThreePointersMade,
			StatId.FreeThrowsAttempted, StatId.FreeThrowsMade
		);
	}

	private readonly timer: Timer;

	private readonly parts: Parts;

	private isRunning = () => this.timer.isRunning;
	private isPaused = () => !this.isRunning();

	/** Gets a scoreboard to display points, time and other info. */
	public override getScoreboard(): string {
		const
			html = this.cache.get(CacheId.Scoreboard, () => {
				const
					ths = [
						`<th scope="col">${upperFirst(this.getParticipantTypeName())}</th>`,
						'<th scope="col">Points</th>'
					],
					isStarted = this.isStarted(),
					isSomeBallPossession = this.hasBallPossession.some(isTruth),
					bodyCells = (isTeamTwo: boolean) => {
						const team = this.participant[!isTeamTwo ? 'getOfOne' : 'getOfTwo']();
						return [
							`<th scope="row">${upperFirst(this.participant.getBy(team).getName())}</th>`,
							`<td>${this.stats.get(StatId.TotalPoints, team)}</td>`
						];
					};
				return (
					`<thead>
						<tr>
							${ths.join('')}
							${ths.reverse().join('')}
							${!isStarted ? EMPTY_HTML : '<th scope="col">Part</th>'}
							${!isStarted ? EMPTY_HTML : '<th scope="col">Time</th>'}
							${!isSomeBallPossession ? EMPTY_HTML : '<th scope="col">Possession</th>'}
						</tr>
					</thead>
					<tbody>
						<tr>
							${bodyCells(false).join('')}
							${bodyCells(true).reverse().join('')}
							${!isStarted ? EMPTY_HTML : `<td>${getOrdinal(this.parts.current)}</td>`}
							${!isStarted ? EMPTY_HTML : `<td>${getInterpolation('mainClock', this.participantsManagerOfDualMetric)}</td>`}
							${!isSomeBallPossession ? EMPTY_HTML : `<td>${getInterpolation('shotClock', this.participantsManagerOfDualMetric)}</td>`}
						</tr>
					</tbody>`
				);
			}),
			getTime = (id: TimerId) => `<span class="${getClassNames(this.isRunning() ? null : 'lowlight')}">${this.timer.getTimeOf(id)}</span>`,
			interpolationDefinition: InterpolationDefinition = [
				['mainClock', this.cache.get(CacheId.MainClock, () => getTime(MAIN_CLOCK_ID))],
				['shotClock', this.cache.get(CacheId.ShotClock, () => getTime(SHOT_CLOCK_ID))]
			];
		return this.getUltimateScoreboard(html, null, interpolationDefinition);
	}

	/** Gets a statistics panel about teams playing data. */
	public override getStats = (): string => this.getUltimateStats([
		StatId.TwoPointersAttempted,
		[StatId.TwoPointersMade, StatId.TwoPointersAttempted, IS_PERCENTAGE_STAT_ID],

		StatId.ThreePointersAttempted,
		[StatId.ThreePointersMade, StatId.ThreePointersAttempted, IS_PERCENTAGE_STAT_ID],

		StatId.FreeThrowsAttempted,
		[StatId.FreeThrowsMade, StatId.FreeThrowsAttempted, IS_PERCENTAGE_STAT_ID],
	]);

	public override getPanel = (): Element => this.getUltimatePanel(this, [
		[
			['Start', 'start']
		],
		[
			['Play with team 1 as opening ball possessor', 'play', true],
			['Play with team 2 as opening ball possessor', 'play', false]
		],
		[
			['Grant timeout to team 1', 'grantTimeoutTo', true],
			['Grant timeout to team 2', 'grantTimeoutTo', false]
		],
		[
			['Play', 'play']
		],
		[
			['Log ball possession of team 1', 'logBallPossessionOf', true],
			['Log ball possession of team 2', 'logBallPossessionOf', false]
		],
		[
			['Pause', 'pause'],
			['Resume', 'resume']
		],
		[
			['Log two-pointer failed', 'logTwoPointerFailed'],
			['Log two-pointer made', 'logTwoPointerMade']
		],
		[
			['Log three-pointer failed', 'logThreePointerFailed'],
			['Log three-pointer made', 'logThreePointerMade']
		],
		[
			['Log free throw failed', 'logFreeThrowFailed'],
			['Log free throw made', 'logFreeThrowMade']
		],
		[
			['Prepare', 'prepare']
		]
	]);

	private verifyIsPlayingOrAtRest() {
		if (!this.isPlaying() && !this.isAtRest())
			throw new Error('The match is not being playing nor is at rest');
	}
	private verifyIsNotPaused() {
		if (this.isPaused())
			throw new Error('The match is already paused');
	}
	private verifyIsPaused() {
		if (!this.isPaused())
			throw new Error('The match is not paused');
	}
	private verifyIsPreparingOrInTimeout() {
		if (!this.isPreparing() && !this.isInTimeout())
			throw new Error('The match is not being prepared nor is in timeout');
	}
	private isInFreeThrowsSituation = () => this.doneFreeThrows > 0;
	private verifyIsNotInFreeThrowsSituation() {
		if (this.isInFreeThrowsSituation())
			throw new Error('The match is in free throws situation');
	}

	public override start(): void {
		super.start(() => { this.timer.resetAll(); });
	}

	private verifyOpeningBallPossessorIsValid(value?: OpeningBallPossessor) {
		const hasValue = isDefined(value);
		if (!this.wasPlayed) {
			if (!hasValue)
				throw new Error('An opening ball possessor is required');
		} else if (hasValue)
			warn('The opening ball possessor is unrequired');
	}
	/**
	 * Starts the prepared match (with a team as opening ball possessor) or restarts (in timeout) the current quarter to play.
	 * @param openingBallPossessor - The team.
	 */
	public override play(openingBallPossessor?: Team): void {
		const hasOpeningBallPossessor = isDefined(openingBallPossessor);
		super.play(
			undefined,
			() => {
				if (!this.wasPlayed && hasOpeningBallPossessor)
					this.logBallPossessionOf(openingBallPossessor);
				this.timer.runAll();
			},
			() => {
				if (hasOpeningBallPossessor)
					this.verifyParticipantIsRegistered(openingBallPossessor);
			},
			() => {
				if (hasOpeningBallPossessor)
					this.verifyIsPreparing();
				else
					this.verifyIsPreparingOrInTimeout();
				this.verifyOpeningBallPossessorIsValid(openingBallPossessor);
			},
			[CacheId.Scoreboard, CacheId.MainClock, CacheId.ShotClock]
		);
	}

	public override grantTimeoutTo(team: Team): void { super.grantTimeoutTo(team); }

	private readonly hasBallPossession = new DualMetric(this.participantsManagerOfDualMetric, false);
	private switchBallPossession() {
		this.hasBallPossession.swap();
		this.possibleFreeThrows = 0;
	}
	private getBallPossessor() {
		const team = this.hasBallPossession.getParticipantIf(isTruth);
		assertIsDefined(team);
		return team;
	}
	private shouldResetShotClock = false;
	private resetShotClock() {
		this.timer.reset(SHOT_CLOCK_ID);
	}
	private verifyCanChangeBallPossession() {
		const isFoulSpecial = // Technical, unsportsmanlike or disqualifying
			this.isInFreeThrowsSituation() && !this.wasOutOfTimeFieldBasketAttempted;
		if (isFoulSpecial)
			throw new Error('Cannot change ball possession');
	}
	/**
	 * Logs the ball possession of a team.
	 * @param team - The team.
	 */
	public logBallPossessionOf(team: Team): void {
		this.verifyParticipantIsRegistered(team);
		this.verifyIsPlaying();
		this.verifyCanChangeBallPossession();

		this.participantsManagerOfDualMetric.focus(team);
		const hasBallPossession = this.hasBallPossession.get();
		if (hasBallPossession)
			warn(`${upperFirst(team.getName())} already has ball possession`);
		else { // Unnecessary event dispatching
			const isTurnover = this.hasBallPossession.getOpponent();
			if (!isTurnover)
				this.hasBallPossession.set(true); // Firstly in quarter
			else {
				this.switchBallPossession();
				if (this.isRunning())
					this.resetShotClock();
				else {
					info(`${upperFirst(team.getName())} has ball possession`);
					this.shouldResetShotClock = true;
				}
			}
		}
	}

	private handleTime(execute: VoidFunction) {
		this.verifyIsPlaying();
		execute();
	}
	private _pause(execute: VoidFunction) { // Auxiliar
		this.handleTime(() => {
			this.verifyIsNotPaused();

			this.timer.pauseAll();
			execute();
			this.dispatchEvent([CacheId.MainClock, CacheId.ShotClock]);
		});
	}
	/** Pauses the time. */
	public pause(): void {
		this._pause(() => {
			this.possibleFreeThrows = FREE_THROWS_BY_UNSPORTSMANLIKE_OR_DISQUALIFYING_FOUL; // At first, only this qty. while no attempted out-of-time field basket
		});
	}
	/** Resumes the time. */
	public resume(): void {
		this.handleTime(() => {
			this.verifyIsPaused();

			if (this.shouldResetShotClock) {
				this.resetShotClock();
				this.shouldResetShotClock = false;
			}

			if (this.wasOutOfTimeFieldBasketAttempted)
				this.wasOutOfTimeFieldBasketAttempted = false;

			if (this.possibleFreeThrows > 0)
				this.possibleFreeThrows = 0;
			if (this.doneFreeThrows > 0)
				this.doneFreeThrows = 0;

			this.timer.runAll();

			this.dispatchEvent([CacheId.MainClock, CacheId.ShotClock]);
		});
	}

	private logBasket(qty: Qty, statIdAttempted: StatId, statIdMade: StatId, isSuccessful: IsSuccessful, verify = noop, execute = noop) {
		this.verifyIsPlayingOrAtRest();
		verify();

		const ballPossessor = this.getBallPossessor();
		this.stats.increase(statIdAttempted, ballPossessor);
		if (isSuccessful) {
			this.stats.increase(statIdMade, ballPossessor);

			for (let i = 0; i < qty; i++)
				this.stats.increase(StatId.TotalPoints, this.getBallPossessor());
		}

		execute();

		this.dispatchEvent(CacheId.Scoreboard);
	}

	private wasOutOfTimeFieldBasketAttempted = false;
	private verifyAttemptedOutOfTimeFieldBasketIsUnique() {
		if (this.wasOutOfTimeFieldBasketAttempted)
			throw new Error('The attempted out-of-time field basket is not unique');
	}
	private logFieldBasket(qty: Qty, statIdAttempted: StatId, statIdMade: StatId, isSuccessful: IsSuccessful) {
		this.logBasket(
			qty,
			statIdAttempted,
			statIdMade,
			isSuccessful,
			() => {
				this.verifyAttemptedOutOfTimeFieldBasketIsUnique();
				this.verifyIsNotInFreeThrowsSituation();
			},
			() => {
				if (!this.isPaused()) {
					if (isSuccessful) {
						this.switchBallPossession();
						this.resetShotClock();
					}
				} else {
					this.wasOutOfTimeFieldBasketAttempted = true;

					const isFailed = !isSuccessful;
					this.possibleFreeThrows = isFailed ? FREE_THROWS_BY_FOUL_WHEN_FAILED_FIELD_BASKET : qty;
				}
			}
		);
	}

	private logTwoPointer(isSuccessful: IsSuccessful) {
		this.logFieldBasket(2, StatId.TwoPointersAttempted, StatId.TwoPointersMade, isSuccessful);
	}
	/** Logs a two-pointer failed. */
	public logTwoPointerFailed(): void { this.logTwoPointer(false); }
	/** Logs a two-pointer made. */
	public logTwoPointerMade(): void { this.logTwoPointer(true); }

	private logThreePointer(isSuccessful: IsSuccessful) {
		this.logFieldBasket(3, StatId.ThreePointersAttempted, StatId.ThreePointersMade, isSuccessful);
	}
	/** Logs a three-pointer failed. */
	public logThreePointerFailed(): void { this.logThreePointer(false); }
	/** Logs a three-pointer made. */
	public logThreePointerMade(): void { this.logThreePointer(true); }

	private possibleFreeThrows = 0;
	private verifyHasPossibleFreeThrows() {
		const isAllDone = this.doneFreeThrows >= // It may be greater
			this.possibleFreeThrows;
		if (isAllDone) {
			const team = this.getBallPossessor();
			throw new Error(`${upperFirst(team.getName())} has no possible free throws`);
		}
	}
	private doneFreeThrows = 0;
	private logFreeThrow(isSuccessful: IsSuccessful) {
		this.logBasket(
			1,
			StatId.FreeThrowsAttempted,
			StatId.FreeThrowsMade,
			isSuccessful,
			() => {
				this.verifyIsPaused();
				this.verifyHasPossibleFreeThrows();
			},
			() => {
				this.doneFreeThrows++;
				this.shouldResetShotClock = true;
			}
		);
	}
	/** Logs a free throw failed. */
	public logFreeThrowFailed(): void { this.logFreeThrow(false); }
	/** Logs a free throw made. */
	public logFreeThrowMade(): void { this.logFreeThrow(true); }

	private finishPart() {
		this.pause();

		const { current, total } = this.parts;
		if (current < total) {
			this.goToRest(RestType.breakPerPhase);
			const isFirstHalfFinished = current === LAST_PART_OF_FIRST_HALF;
			if (isFirstHalfFinished)
				this.resetTimeouts();
		} else
			this.finish();

		this.dispatchEvent();
	}

	/** Starts (at break) the next quarter to prepare it. */
	public prepare(): void {
		this.verifyIsStarted();
		this.verifyIsAtBreakPerPhase('quarter');

		this.switchBallPossession();

		this.parts.current++;
		this.timer.resetAll();

		this.stage = MatchStage.Preparing;

		info('The quarter is being prepared…');

		this.dispatchEvent(CacheId.Scoreboard);
	}
}