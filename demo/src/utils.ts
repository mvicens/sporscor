import { SPORTS } from './consts';
import { Player, Team, TennisMatch } from './lib';
import sectionHtmlContent from './section.html?raw';

function getHtmlElement<T extends HTMLElement>(selectors: string) {
	const value = document.querySelector<T>(selectors);
	assertIsNonNullable(value);
	return value;
}

function toElement(htmlContent: string) {
	const
		domParser = new DOMParser(),
		document = domParser.parseFromString(htmlContent, 'text/html'),
		value = document.body.firstElementChild;
	assertIsNonNullable(value);
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

export function buildDropdown() {
	const elem = getHtmlElement('.dropdown-menu');
	SPORTS.forEach(item => {
		const childElem = toElement(`<li><a class="dropdown-item" href="#">${item.name}</a></li>`);
		childElem.addEventListener('click', () => { addChoice(item); });
		elem.appendChild(childElem);
	});
}

const
	getSelectors = (index: number, className: string) => `.card:nth-child(${index + 1}) .${className}`,
	isTennisMatch = (value: unknown): value is typeof TennisMatch => value === TennisMatch;
export function addChoice(item: typeof SPORTS[number]) {
	const sectionElement = toElement(sectionHtmlContent);

	const titleElement = sectionElement.querySelector('.card-header');
	assertIsNonNullable(titleElement);
	titleElement.textContent = item.name;

	const index = document.querySelectorAll('.card').length;

	getHtmlElement('main').appendChild(sectionElement);

	const { class: Class } = item;
	let instance: InstanceType<typeof Class>;
	const onChange = () => {
		setHtmlContent(getSelectors(index, 'scoreboard'), instance.getScoreboard());
		setHtmlContent(getSelectors(index, 'stats'), instance.getStats());
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
	getHtmlElement(getSelectors(index, 'panel')).append(instance.getPanel());
}

const isNonNullable = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined;
function assertIsNonNullable<T>(value: T): asserts value is NonNullable<T> {
	if (!isNonNullable(value))
		throw new Error(`Expected a non-nullable value, but received: ${value}`);
}