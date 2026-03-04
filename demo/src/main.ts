import 'bootstrap/js/src/dropdown.js';
import bodyHtmlContent from './body.html?raw';
import { buildDropdown, setHtmlContent, setTheme } from './utils';
import './style.css'; // In order to overwrite, located after

setTheme();
setHtmlContent('body', bodyHtmlContent, () => { buildDropdown(); });