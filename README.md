# SporScor

API to manage scoreboard and statistics of sports.

Implemented sport matches (for now):
- Basketball
- Tennis (only players, not pairs)
- Volleyball

## Get started

```sh
npm install sporscor
```

This is a sample with tennis:

```ts
import { Player, TennisMatch } from 'sporscor';

// Obviously, you can add it directly by HTML
const selectors = '#app'; // Or wherever content is
document.querySelector(selectors)!.innerHTML = `
	<div id="scoreboard"></div>
	<div id="stats"></div>
`;

// Players instances
const
	playerOne = new Player('R. Federer'),
	playerTwo = new Player('R. Nadal');

// Match instance
const match = new TennisMatch(playerOne, playerTwo, () => {
	// It occurs on change
	document.getElementById('scoreboard')!.innerHTML = match.getScoreboard();
	document.getElementById('stats')!.innerHTML = match.getStats();
});
```

And then, proceed like e.g.:

```ts
match.start();
// match.play(); // It would failed
match.grantOpeningServeTo(playerTwo);
match.play();
match.logPointWonBy(playerTwo);
match.logServeAsFault();
match.logPointWonBy(playerOne);	
match.logPointWonBy(playerTwo);
match.logServeAsAce();
```

Look at current scoreboard and stats. What about it?

To speed it up, you can use the panel, obtained from `.getPanel()`.