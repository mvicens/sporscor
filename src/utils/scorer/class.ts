import { assertIsArray, assertIsDefined, DeveloperError, DualMetric, ensureArray, identity, isArray, isDefined, isUndefined, resolveValueOrProvider } from '..';
import type { OnNewByScoreLevel } from '../../match/scored/types';
import type { Index } from '../../types';
import { SHOULD_CONTINUE, SHOULD_INTERRUPT } from './consts';
import { ScoreLevel } from './enums';
import type { Data, IsHigherScoreLevelNew, LoopCb, NestedPoints, NestedPointsItem, OnFinish, ScoreLevelConfig } from './types';

export default class Scorer {
	constructor(scoreLevelsConfig: Array<ScoreLevelConfig>, onFinish: OnFinish, onNewByScoreLevel: OnNewByScoreLevel) {
		if (scoreLevelsConfig.at(0)?.scoreLevel !== ScoreLevel.Point)
			throw new DeveloperError('1st score level must be point\'s');

		this.#data = scoreLevelsConfig.map(item => ({
			...item,
			transformer: item.transformer ?? identity,
			qty: new DualMetric(0),
			detailedQty: []
		}));

		this.#onFinish = onFinish;

		this.#onNewByScoreLevel = onNewByScoreLevel;
	}

	#data: Data;

	#nestedPoints: NestedPoints = [];

	#onFinish: OnFinish;

	#onNewByScoreLevel: OnNewByScoreLevel;

	#isWon(item: Data[number]) {
		const { qty } = item;

		const target = resolveValueOrProvider(item.target, this);
		if (qty.isLessThan(target))
			return false;

		const
			withLead = resolveValueOrProvider(item.withLead, this),
			result = !withLead || qty.isDiffAtLeast(2);
		return result;
	}

	isOnePointToWin() {
		const
			item = this.getBy(ScoreLevel.Point),
			hypotheticalQty = item.qty.clone();
		hypotheticalQty.increment();
		const hypotheticalItem = {
			...item,
			qty: hypotheticalQty
		};
		return this.#isWon(hypotheticalItem);
	}

	getBy(scoreLevel: ScoreLevel) {
		const item = this.#data.find(({ scoreLevel: comparedScoreLevel }) => comparedScoreLevel === scoreLevel);
		assertIsDefined(item);
		return item;
	}

	getNestedPoints(...indexes: Array<Index>) {
		let result: NestedPointsItem = this.#nestedPoints;
		indexes.forEach(item => {
			assertIsArray(result);
			const otherResult = result.at(item);
			assertIsDefined(otherResult);
			result = otherResult;
		});

		if (!(result instanceof DualMetric))
			throw new DeveloperError('Result must be dual metric');

		return result;
	}

	#incrementPoint() {
		let previousQty: Data[number]['detailedQty'][number];
		this.forEach(item => {
			if (isDefined(previousQty))
				item.detailedQty.push(previousQty);

			const
				{ scoreLevel, qty } = item,
				dispatchEvent = (isHigherScoreLevelNew: IsHigherScoreLevelNew) => {
					let onNewScoreLevel = this.#onNewByScoreLevel[scoreLevel];
					if (isDefined(onNewScoreLevel))
						ensureArray(onNewScoreLevel).forEach(item => {
							item(this, isHigherScoreLevelNew);
						});
				};

			qty.increment();

			if (scoreLevel === ScoreLevel.Point) {
				let
					container: NestedPoints = this.#nestedPoints,
					content: NestedPoints | NestedPointsItem,
					index: Index;
				this.forReversedEach(({ scoreLevel, qty }) => {
					if (scoreLevel !== ScoreLevel.Point) {
						if (isArray(content))
							container = content;
						index = qty.getTotal();
						let otherContent = container.at(index);
						if (isUndefined(otherContent))
							otherContent = container[index] = [];
						content = otherContent;
					} else
						container[index] = qty.clone();
				});
			}

			const isWon = this.#isWon(item);
			if (!isWon) {
				dispatchEvent(!SHOULD_INTERRUPT);
				return SHOULD_INTERRUPT;
			}

			if (scoreLevel !== ScoreLevel.Set) {
				previousQty = qty.clone();

				qty.resetAll();

				dispatchEvent(!SHOULD_CONTINUE);
				return SHOULD_CONTINUE;
			} else
				this.#onFinish(); // No return nor event dispatching due to last loop
		});
	}
	increment(scoreLevel: ScoreLevel) {
		if (scoreLevel === ScoreLevel.Point)
			this.#incrementPoint();
		else
			for (
				const getQty = () => this.getBy(scoreLevel).qty.get(), initial = getQty();
				initial === getQty();
				this.#incrementPoint()
			);
	}

	#forEachBy(data: Data, cb: LoopCb) {
		for (let index in data) {
			const
				item = data[index],
				shouldInterrupt = cb(item);
			if (shouldInterrupt)
				break;
			// else
			// 	continue;
		}
	}
	forEach(cb: LoopCb) {
		this.#forEachBy(this.#data, cb);
	}
	forReversedEach(cb: LoopCb) { // Point as last
		this.#forEachBy(this.#data.toReversed(), cb);
	}
}