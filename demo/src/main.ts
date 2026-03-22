import 'bootstrap/js/src/dropdown.js';
import bodyHtmlContent from './body.html?raw';
import { SPORTS } from './consts';
import './style.css';
import { buildDropdown, createMatch, setHtmlContent, setTheme } from './utils';

setTheme();
setHtmlContent('body', bodyHtmlContent, () => {
	buildDropdown('body', SPORTS.map(sport => [sport.label, () => { createMatch(sport); }]));
});