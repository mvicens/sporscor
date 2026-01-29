import ScoredMatch, { ScoreLevel } from '..';
import { IS_PERCENTAGE_STAT_ID, RestType, Sport, type MatchConfig } from '../..';
import { EMPTY_HTML } from '../../../consts';
import { Team } from '../../../participant';
import { DualMetric, getRatio, isDefined } from '../../../utils';
import { StatId } from '../../utils';
import { MIN_TO_WIN_SET, MIN_TO_WIN_TIE_BREAK, POINTS_MAX_TO_GO_TO_REST, POINTS_MAX_TO_GO_TO_REST_IN_TIE_BREAK, SERVES_PER_POINT, TOTAL_OF_SETS } from './consts';
import { getTimeoutsPerPhase, isInTieBreak } from './fns';
import type { PendingPointsMaxToGoToRest } from './types';

export default class VolleyballMatch extends ScoredMatch {
	constructor(teamOne: Team, teamTwo: Team, onChange: MatchConfig['onChange']) {
		super({
			sport: Sport.Volleyball,
			participants: [teamOne, teamTwo],
			onChange,
			timeouts: {
				qtyPerPhase: () => getTimeoutsPerPhase(this.scorer),
				isDoneable: () => this.isSomePointDone
			},

			scoreLevelsConfig: [
				{
					scoreLevel: ScoreLevel.Point,
					target: scorer => !isInTieBreak(scorer) ? MIN_TO_WIN_SET : MIN_TO_WIN_TIE_BREAK,
					withLead: true
				},
				TOTAL_OF_SETS
			],
			serve: {
				qtyPerPoint: SERVES_PER_POINT,
				getServer: () => {
					if (this.isLastPointWon.get() === this.isLastPointWon.getOpponent()) { // Both false
						const isOpeningServer = true;
						return isOpeningServer;
					}

					const team = this.isLastPointWon.getOfOne() ? teamOne : teamTwo;
					return team;
				}
			},
			onNewByScoreLevel: {
				[ScoreLevel.Point]: (scorer, isSetNew) => {
					if (isSetNew)
						return;

					this.isSomePointDone = true;

					if (!isInTieBreak(scorer)) {
						const
							pointsMax = scorer.getBy(ScoreLevel.Point).qty.getMax(),
							shouldDo = this.pendingPointsMaxToGoToRest.has(pointsMax);
						if (shouldDo) {
							this.goToRest(RestType.breakPerPoint);
							this.pendingPointsMaxToGoToRest.delete(pointsMax);
						}
					}
				},
				[ScoreLevel.Set]: () => {
					this.resetTimeouts();
					this.resetPendingPointsMaxToGoToRest();
				}
			}
		});

		this.stats.makeAvailable(
			StatId.TotalServicePoints, StatId.ServiceErrors,
			/* StatId.TotalServicePoints, */ StatId.PointScoring,
			StatId.TotalReceptionPoints, StatId.SideOut
		);

		this.resetPendingPointsMaxToGoToRest();
	}

	private isLastPointWon = new DualMetric(false);

	public getScoreboard = () => this.getDefinedScoreboard(
		[
			['extraTh', '<th scope="col">Timeouts</th>'],
			[
				'extraTd',
				team => isDefined(team)
					? `<td>${getRatio(this.timeouts?.doneQty.getBy(team) ?? 0, getTimeoutsPerPhase(this.scorer))}</td>`
					: EMPTY_HTML
			]
		],
		true,
		true
	);

	public getStats = () => this.getDefinedStats([
		[StatId.ServiceErrors, StatId.TotalServicePoints, IS_PERCENTAGE_STAT_ID],
		[StatId.PointScoring, StatId.TotalServicePoints, IS_PERCENTAGE_STAT_ID],
		[StatId.SideOut, StatId.TotalReceptionPoints, IS_PERCENTAGE_STAT_ID]
	]);

	public getPanel() {
		const
			teamOne = this.participant.getOfOne(),
			teamTwo = this.participant.getOfTwo();
		return this.getUltimatePanel([
			[
				['Start', () => { this.start(); }]
			],
			[
				['Grant opening serve to team 1', () => { this.grantOpeningServeTo(teamOne); }],
				['Grant opening serve to team 2', () => { this.grantOpeningServeTo(teamTwo); }]
			],
			[
				['Play', () => { this.play(); }]
			],
			[
				['Grant timeout to team 1', () => { this.grantTimeoutTo(teamOne as Team); }],
				['Grant timeout to team 2', () => { this.grantTimeoutTo(teamTwo as Team); }]
			],
			[
				['Log serve as fault', () => { this.logServeAsFault(); }],
				['Log serve as ace', () => { this.logServeAsAce(); }]
			],
			[
				['Log point as let', () => { this.logPointAsLet(); }]
			],
			[
				['Log point won by team 1', () => { this.logPointWonBy(teamOne as Team); }],
				['Log point won by team 2', () => { this.logPointWonBy(teamTwo as Team); }]
			]
		]);
	}

	private isSomePointDone = // Since inactivity
		false;

	public play() {
		super.play(undefined, () => { this.isSomePointDone = false; });
	}

	public grantTimeoutTo(team: Team) { super.grantTimeoutTo(team); }

	public logPointWonBy(team: Team) {
		super.logPointWonBy(
			team,
			(server, receiver, isServerWinner) => {
				this.stats.increase(StatId.TotalReceptionPoints, receiver);

				if (isServerWinner)
					this.stats.increase(StatId.PointScoring, server);
				else
					this.stats.increase(StatId.SideOut, receiver);
			},
			() => {
				this.isLastPointWon.set(true);
				this.isLastPointWon.setOpponent(false);
			}
		);
	}

	private pendingPointsMaxToGoToRest: PendingPointsMaxToGoToRest = new Set();
	private resetPendingPointsMaxToGoToRest() {
		this.pendingPointsMaxToGoToRest = new Set(
			!isInTieBreak(this.scorer)
				? POINTS_MAX_TO_GO_TO_REST
				: POINTS_MAX_TO_GO_TO_REST_IN_TIE_BREAK
		);
	}
}