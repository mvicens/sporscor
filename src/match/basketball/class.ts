import Match, { IS_PERCENTAGE_STAT_ID, RestType, Sport, type MatchConfig } from '..';
import { EMPTY_HTML } from '../../consts';
import type { Team } from '../../participant';
import { DualMetric, StatId, Timer, assertIsDefined, getClassNames, getOrdinal, info, isDefined, isTrue, noop, upperFirst, warn, type TimerId, type TimerItem } from '../../utils';
import { Stage } from '../enums';
import { DECIMALED_MINUTES, DECIMALED_POSSESSION_SECONDS, INITIAL_MINUTES, INITIAL_POSSESSION_SECONDS, PARTS, POSSESSION_ID, TIMEOUTS_PER_FIRST_HALF, TIMEOUTS_PER_SECOND_HALF } from './consts';
import type { OpeningBallPossessor, Parts } from './types';

export default class BasketballMatch extends Match {
	constructor(teamOne: Team, teamTwo: Team, onChange: MatchConfig['onChange']) {
		super({
			sport: Sport.Basketball,
			participants: [teamOne, teamTwo],
			onChange,
			timeouts: {
				qtyPerPhase: () => this.parts.current <= 2 ? TIMEOUTS_PER_FIRST_HALF : TIMEOUTS_PER_SECOND_HALF,
				isDoneable: team => this.isPaused() && this.hasBallPossession.getBy(team)
			}
		});

		const
			onChangeTimer = () => { this.dispatchEvent(); },
			items: Array<TimerItem> = [
				{
					id: 'general',
					initialTime: INITIAL_MINUTES * 60,
					decimaledTime: DECIMALED_MINUTES * 60,
					onChange: onChangeTimer,
					onFinish: () => { this.finishPart(); }
				},
				{
					id: POSSESSION_ID,
					initialTime: INITIAL_POSSESSION_SECONDS,
					decimaledTime: DECIMALED_POSSESSION_SECONDS,
					onChange: onChangeTimer,
					onFinish: () => {
						this._pause(() => {
							info('The possession time is over');

							this.switchBallPossession();
							this.shouldResetPossessionTime = true;
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
			participantTypeTh = `<th scope="col">${upperFirst(this.getParticipantTypeName())}</th>`,
			pointsTh = '<th scope="col">Points</th>',
			isStarted = this.isStarted(),
			isSomeBallPossession = this.hasBallPossession.some(isTrue),
			getTime = (id: TimerId) => `<span class="${getClassNames(this.isRunning() ? null : 'lowlight')}">${this.timer.getTimeOf(id)}</span>`;
		return this.getUltimateScoreboard(
			`<thead>
					<tr>
						${participantTypeTh}
						${pointsTh}
						${pointsTh}
						${participantTypeTh}
						${!isStarted ? EMPTY_HTML : '<th scope="col">Part</th>'}
						${!isStarted ? EMPTY_HTML : '<th scope="col">Time</th>'}
						${!isSomeBallPossession ? EMPTY_HTML : '<th scope="col">Possession</th>'}
					</tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row">${upperFirst(this.participant.getOfOne().getName())}</th>
						<td>${this.stats.getOfOne(StatId.TotalPoints)}</td>
						<td>${this.stats.getOfTwo(StatId.TotalPoints)}</td>
						<th scope="row">${upperFirst(this.participant.getOfTwo().getName())}</th>
						${!isStarted ? EMPTY_HTML : `<td>${getOrdinal(this.parts.current)}</td>`}
						${!isStarted ? EMPTY_HTML : `<td>${getTime('general')}</td>`}
						${!isSomeBallPossession ? EMPTY_HTML : `<td>${getTime(POSSESSION_ID)}</td>`}
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

	private verifyIsOpeningBallPossessorRequired(value?: OpeningBallPossessor) {
		const hasOpeningBallPossessor = isDefined(value);
		if (!this.wasPlayed) {
			if (!hasOpeningBallPossessor)
				throw new Error('An opening ball possessor is required');
		} else if (hasOpeningBallPossessor)
			warn('The opening ball possessor is unrequired');
	}
	private verifyIsPlayingOrAtRest() {
		if (!this.isPlaying() && !this.isAtRest())
			throw new Error('The match is not being playing nor is at rest');
	}
	private verifyIsNotPaused() {
		if (!this.isRunning())
			throw new Error('The match is already paused');
	}
	private verifyIsPaused() {
		if (this.isRunning())
			throw new Error('The match is not paused');
	}
	private verifyIsInTimeoutOrPreparing() {
		if (!this.isInTimeout() && !this.isPreparing())
			throw new Error('The match is not in timeout nor is being prepared');
	}

	public start() {
		super.start(() => { this.timer.resetAll(); });
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
				this.verifyIsOpeningBallPossessorRequired(openingBallPossessor);
			}
		);
	}

	private hasBallPossession = new DualMetric(false);
	private switchBallPossession() { this.hasBallPossession.swap(); }
	private getBallPossessor() {
		const team = this.hasBallPossession.getParticipantIf(isTrue);
		assertIsDefined(team);
		return team;
	}
	private shouldResetPossessionTime = false;
	private resetPosessionTime() {
		this.timer.reset(POSSESSION_ID);
	}
	public logBallPossessionOf(team: Team) {
		this.verifyIsParticipantRegistered(team);
		this.verifyIsPlaying();

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
					this.resetPosessionTime();
				else {
					info(`${upperFirst(team.getName())} has ball possession`);
					this.shouldResetPossessionTime = true;
				}
			}
		}
	}

	private handleTime(execute: VoidFunction) {
		this.verifyIsPlaying();
		execute();
	}
	private _pause(execute = noop) { // Auxiliar
		this.handleTime(() => {
			this.verifyIsNotPaused();

			this.timer.pauseAll();
			execute();
			this.dispatchEvent();
		});
	}
	public pause() { this._pause(); }
	public resume() {
		this.handleTime(() => {
			this.verifyIsPaused();

			if (this.shouldResetPossessionTime) {
				this.resetPosessionTime();
				this.shouldResetPossessionTime = false;
			}

			if (this.wasPointAttemptedOutOfTime)
				this.wasPointAttemptedOutOfTime = false;

			if (this.isInFreeThrowsSituation)
				this.isInFreeThrowsSituation = false;

			this.timer.runAll();

			this.dispatchEvent();
		});
	}

	private wasPointAttemptedOutOfTime = false;
	private verifyIsPointFirstAttemptedOutOfTime() {
		if (this.wasPointAttemptedOutOfTime)
			throw new Error('There was already a attempted point out of time');
	}
	private verifyIsNotInFreeThrowsSituation() {
		if (this.isInFreeThrowsSituation)
			throw new Error('The match is in free throws situation');
	}
	private getFnOfLogPoints(qty: number, statIdAttempted: StatId, statIdMade: StatId, isSuccessful: boolean, verify = noop, execute = noop) {
		return () => {
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
		};
	}
	private getFnOfLogNormalPoints(qty: number, statIdAttempted: StatId, statIdMade: StatId, isSuccessful: boolean) {
		return this.getFnOfLogPoints(
			qty,
			statIdAttempted,
			statIdMade,
			isSuccessful,
			() => {
				this.verifyIsPointFirstAttemptedOutOfTime();
				this.verifyIsNotInFreeThrowsSituation();
			},
			() => {
				if (!this.isPaused()) {
					this.switchBallPossession();
					this.resetPosessionTime();
				} else
					this.wasPointAttemptedOutOfTime = true;
			}
		);
	}
	private getFnOfLogFreeThrow(qty: number, statIdAttempted: StatId, statIdMade: StatId, isSuccessful: boolean) {
		return this.getFnOfLogPoints(
			qty,
			statIdAttempted,
			statIdMade,
			isSuccessful,
			() => { this.verifyIsPaused(); },
			() => {
				this.isInFreeThrowsSituation = true;
				this.shouldResetPossessionTime = true;
			}
		);
	}

	public logTwoPointerMade = this.getFnOfLogNormalPoints(2, StatId.TwoPointersAttempted, StatId.TwoPointersMade, true);
	public logTwoPointerFailed = this.getFnOfLogNormalPoints(2, StatId.TwoPointersAttempted, StatId.TwoPointersMade, false);

	public logThreePointerMade = this.getFnOfLogNormalPoints(3, StatId.ThreePointersAttempted, StatId.ThreePointersMade, true);
	public logThreePointerFailed = this.getFnOfLogNormalPoints(3, StatId.ThreePointersAttempted, StatId.ThreePointersMade, false);

	private isInFreeThrowsSituation = false;
	public logFreeThrowMade = this.getFnOfLogFreeThrow(1, StatId.FreeThrowsAttempted, StatId.FreeThrowsMade, true);
	public logFreeThrowFailed = this.getFnOfLogFreeThrow(1, StatId.FreeThrowsAttempted, StatId.FreeThrowsMade, false);

	private finishPart() {
		this._pause();

		const { current, total } = this.parts;
		if (current < total) {
			this.goToRest(RestType.breakPerPhase);
			const isFirstHalfFinished = current === 2;
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