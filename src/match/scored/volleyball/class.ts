import ScoredMatch, { ScoreLevel } from '..';
import { IS_PERCENTAGE_STAT_ID, RestType, Sport } from '../..';
import { EMPTY_HTML } from '../../../consts';
import { Team } from '../../../participant';
import { DualMetric, getRatio, isDefined, isFalse } from '../../../utils';
import { StatId } from '../../utils';
import { MIN_TO_WIN_SET, MIN_TO_WIN_TIE_BREAK, POINTS_MAX_TO_GO_TO_REST, POINTS_MAX_TO_GO_TO_REST_IN_TIE_BREAK, SERVES_PER_POINT, TOTAL_OF_SETS } from './consts';
import { getTimeoutsPerPhase, isInTieBreak } from './fns';
import type { PendingPointsMaxToGoToRest } from './types';

/**
 * Represents a volleyball match.
 */
export default class VolleyballMatch extends ScoredMatch {
	/**
	 * Creates a new volleyball match.
	 *
	 * @param teamOne - The 1st team to participate.
	 * @param teamTwo - The 2nd team to participate.
	 * @param onChange - A callback called when the scoreboard and/or statistics change.
	 */
	constructor(teamOne: Team, teamTwo: Team, onChange: VoidFunction) {
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
					if (this.isLastPointWon.every(isFalse)) {
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

	private readonly isLastPointWon = new DualMetric(this.participantsManagerOfDualMetric, false);


	/**
	 * Gets a scoreboard to display points, sets and other info.
	 *
	 * @return The HTML content.
	 */
	public getScoreboard = (): string => this.getDefinedScoreboard(
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

	/**
	 * Gets a statistics panel about teams playing data.
	 *
	 * @return The HTML content.
	 */
	public getStats = (): string => this.getDefinedStats([
		[StatId.ServiceErrors, StatId.TotalServicePoints, IS_PERCENTAGE_STAT_ID],
		[StatId.PointScoring, StatId.TotalServicePoints, IS_PERCENTAGE_STAT_ID],
		[StatId.SideOut, StatId.TotalReceptionPoints, IS_PERCENTAGE_STAT_ID]
	]);

	/**
	 * Gets a control panel to interact by buttons (instead invoke the API methods).
	 *
	 * @return The HTML element.
	 */
	public getPanel = (): Element => this.getUltimatePanel(this, [
		[
			['Start', 'start']
		],
		[
			['Grant opening serve to team 1', 'grantOpeningServeTo', true],
			['Grant opening serve to team 2', 'grantOpeningServeTo', false]
		],
		[
			['Play', 'play']
		],
		[
			['Grant timeout to team 1', 'grantTimeoutTo', true],
			['Grant timeout to team 2', 'grantTimeoutTo', false]
		],
		[
			['Log serve as fault', 'logServeAsFault'],
			['Log serve as ace', 'logServeAsAce']
		],
		[
			['Log point as let', 'logPointAsLet']
		],
		[
			['Log point won by team 1', 'logPointWonBy', true],
			['Log point won by team 2', 'logPointWonBy', false]
		]
	]);

	private isSomePointDone = // Since inactivity
		false;

	/**
	 * Grants the opening serve to a team.
	 *
	 * @param team - The team.
	 */
	public override grantOpeningServeTo(team: Team): void { super.grantOpeningServeTo(team); }

	/**
	 * Starts the prepared match or (at break) the next set, or restarts (in timeout) the current set, to play.
	 */
	public override play(): void {
		super.play(undefined, () => { this.isSomePointDone = false; });
	}

	/**
	 * Grants a timeout to a team.
	 *
	 * @param team - The team.
	 */
	public override grantTimeoutTo(team: Team): void { super.grantTimeoutTo(team); }

	/**
	 * Logs a point won by a team.
	 *
	 * @param team - The team.
	 */
	public override  logPointWonBy(team: Team): void {
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