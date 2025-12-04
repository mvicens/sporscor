import Match, { IS_PERCENTAGE_STAT_ID, RestType, Sport, type MatchConfig } from '..';
import { EMPTY_HTML } from '../../consts';
import type { Team } from '../../participant';
import { DualMetric, StatId, Timer, assertIsDefined, getClassNames, getOrdinal, info, isDefined, isTruth, noop, upperFirst, warn, type TimerId, type TimerItem } from '../../utils';
import { Stage } from '../enums';
import { DECIMALED_MINUTES, DECIMALED_SHOT_CLOCK_SECONDS, FREE_THROWS_BY_FOUL_WHEN_FAILED_FIELD_BASKET, FREE_THROWS_BY_UNSPORTSMANLIKE_OR_DISQUALIFYING_FOUL, INITIAL_MINUTES, INITIAL_SHOT_CLOCK_SECONDS, LAST_PART_OF_FIRST_HALF, MAIN_CLOCK_ID, PARTS, SHOT_CLOCK_ID, TIMEOUTS_PER_FIRST_HALF, TIMEOUTS_PER_SECOND_HALF } from './consts';
import type { IsSuccessful, OpeningBallPossessor, Parts, Qty } from './types';

export default class BasketballMatch extends Match {
	constructor(teamOne: Team, teamTwo: Team, onChange: MatchConfig['onChange']) {
		super({
			sport: Sport.Basketball,
			participants: [teamOne, teamTwo],
			onChange,
			timeouts: {
				qtyPerPhase: () => this.parts.current <= LAST_PART_OF_FIRST_HALF ? TIMEOUTS_PER_FIRST_HALF : TIMEOUTS_PER_SECOND_HALF,
				isDoneable: team => this.isPaused() && this.hasBallPossession.getBy(team)
			}
		});

		const
			onTimerChange = () => { this.dispatchEvent(); },
			items: Array<TimerItem> = [
				{
					id: MAIN_CLOCK_ID,
					initialTime: INITIAL_MINUTES * 60,
					decimaledTime: DECIMALED_MINUTES * 60,
					onChange: onTimerChange,
					onFinish: () => { this.finishPart(); }
				},
				{
					id: SHOT_CLOCK_ID,
					initialTime: INITIAL_SHOT_CLOCK_SECONDS,
					decimaledTime: DECIMALED_SHOT_CLOCK_SECONDS,
					onChange: onTimerChange,
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

	private timer: Timer;

	private parts: Parts;

	private isRunning = () => this.timer.isRunning;
	private isPaused = () => !this.isRunning();

	public getScoreboard() {
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
			},
			getTime = (id: TimerId) => `<span class="${getClassNames(this.isRunning() ? null : 'lowlight')}">${this.timer.getTimeOf(id)}</span>`;
		return this.getUltimateScoreboard(
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
						${!isStarted ? EMPTY_HTML : `<td>${getTime(MAIN_CLOCK_ID)}</td>`}
						${!isSomeBallPossession ? EMPTY_HTML : `<td>${getTime(SHOT_CLOCK_ID)}</td>`}
					</tr>
				</tbody>`
		);
	}

	public getStats = () => this.getUltimateStats([
		StatId.TwoPointersAttempted,
		[StatId.TwoPointersMade, StatId.TwoPointersAttempted, IS_PERCENTAGE_STAT_ID],

		StatId.ThreePointersAttempted,
		[StatId.ThreePointersMade, StatId.ThreePointersAttempted, IS_PERCENTAGE_STAT_ID],

		StatId.FreeThrowsAttempted,
		[StatId.FreeThrowsMade, StatId.FreeThrowsAttempted, IS_PERCENTAGE_STAT_ID],
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
	private verifyIsInTimeoutOrPreparing() {
		if (!this.isInTimeout() && !this.isPreparing())
			throw new Error('The match is not in timeout nor is being prepared');
	}
	private isInFreeThrowsSituation = () => this.doneFreeThrows > 0;
	private verifyIsNotInFreeThrowsSituation() {
		if (this.isInFreeThrowsSituation())
			throw new Error('The match is in free throws situation');
	}

	public start() {
		super.start(() => { this.timer.resetAll(); });
	}

	private verifyIsOpeningBallPossessorOk(value?: OpeningBallPossessor) {
		const hasValue = isDefined(value);
		if (!this.wasPlayed) {
			if (!hasValue)
				throw new Error('An opening ball possessor is required');
		} else if (hasValue)
			warn('The opening ball possessor is unrequired');
	}
	public play(openingBallPossessor?: OpeningBallPossessor) {
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
					this.verifyIsParticipantRegistered(openingBallPossessor);
			},
			() => {
				if (hasOpeningBallPossessor)
					this.verifyIsPreparing();
				else
					this.verifyIsInTimeoutOrPreparing();
				this.verifyIsOpeningBallPossessorOk(openingBallPossessor);
			}
		);
	}

	private hasBallPossession = new DualMetric(false);
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
	public logBallPossessionOf(team: Team) {
		this.verifyIsParticipantRegistered(team);
		this.verifyIsPlaying();
		this.verifyCanChangeBallPossession();

		DualMetric.setFocusedParticipant(team);
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
			this.dispatchEvent();
		});
	}
	public pause() {
		this._pause(() => {
			this.possibleFreeThrows = FREE_THROWS_BY_UNSPORTSMANLIKE_OR_DISQUALIFYING_FOUL; // At first, only this qty. while no attempted out-of-time field basket
		});
	}
	public resume() {
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

			this.dispatchEvent();
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

		this.dispatchEvent();
	}

	private wasOutOfTimeFieldBasketAttempted = false;
	private verifyIsAttemptedOutOfTimeFieldBasketUnique() {
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
				this.verifyIsAttemptedOutOfTimeFieldBasketUnique();
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
	public logTwoPointerFailed() { this.logTwoPointer(false); }
	public logTwoPointerMade() { this.logTwoPointer(true); }

	private logThreePointer(isSuccessful: IsSuccessful) {
		this.logFieldBasket(3, StatId.ThreePointersAttempted, StatId.ThreePointersMade, isSuccessful);
	}
	public logThreePointerFailed() { this.logThreePointer(false); }
	public logThreePointerMade() { this.logThreePointer(true); }

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
	public logFreeThrowFailed() { this.logFreeThrow(false); }
	public logFreeThrowMade() { this.logFreeThrow(true); }

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

	public prepare() {
		this.verifyIsStarted();
		this.verifyIsAtBreakPerPhase('quarter');

		this.switchBallPossession();

		this.parts.current++;
		this.timer.resetAll();

		this.stage = Stage.Preparing;

		info('The quarter is being prepared...');

		this.dispatchEvent();
	}
}