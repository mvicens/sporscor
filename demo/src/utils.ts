import { Player, Team, TennisMatch } from '../../src';
import { SPORTS } from './consts';

function getHtmlElement<T extends HTMLElement>(selectors: string) {
	const value = document.querySelector<T>(selectors);
	assertIsDefined(value);
	return value;
}

export function setTheme() {
	const value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	document.documentElement.setAttribute('data-bs-theme', value);
}

export function setHtmlContent(selectors: string, value: string, onFinish?: VoidFunction) {
	getHtmlElement(selectors).innerHTML = value;
	onFinish?.();
}

function clearHtmlContent(selectors: string) {
	setHtmlContent(selectors, '');
}

export function buildSelector(onFinish: VoidFunction) {
	const elem = getHtmlElement('select');
	SPORTS.forEach(({ name, symbol }) => {
		elem.innerHTML += `<option value="${name}">${symbol} ${name}</option>`;
	});
	elem.addEventListener('change', () => { buildSelection(); });

	onFinish();
}

const isTennisMatch = (value: unknown): value is typeof TennisMatch => value === TennisMatch;
export function buildSelection() {
	const
		name = getHtmlElement<HTMLSelectElement>('select').value,
		Class = SPORTS.find(({ name: searchedName }) => searchedName === name)?.class;
	assertIsDefined(Class);

	clearHtmlContent('#scoreboard');
	clearHtmlContent('#stats');
	clearHtmlContent('#panel');

	let instance: InstanceType<typeof Class>;
	const onChange = () => {
		setHtmlContent('#scoreboard', instance.getScoreboard());
		setHtmlContent('#stats', instance.getStats());
	};
	if (isTennisMatch(Class)) {
		const
			playerOne = new Player('Player 1'),
			playerTwo = new Player('Player 2');
		instance = new Class(playerOne, playerTwo, onChange);
	} else {
		const
			teamOne = new Team('Team 1'),
			teamTwo = new Team('Team 2');
		instance = new Class(teamOne, teamTwo, onChange);
	}
	getHtmlElement('#panel').append(instance.getPanel());
}

const isDefined = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined;
function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
	if (!isDefined(value))
		throw new Error(`Expected a defined value, but received: ${value}`);
}