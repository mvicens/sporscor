# SporScor

TypeScript API to manage sports data, including scoreboards and statistics.

Implemented matches (for now):
- Basketball
- Tennis (only players, not pairs)
- Volleyball

## Demo

[Here](https://mvicens.github.io/sporscor/) you have to try it out.

## Get started

```sh
npm install sporscor
```

This is a sample with tennis:

```ts
import { Player, TennisMatch } from 'sporscor';

const
	playerOne = new Player('R. Federer'),
	playerTwo = new Player('R. Nadal'),

	// Obviously, you can use any HTML elements you want
	scoreboard = document.getElementById('scoreboard'),
	stats = document.getElementById('stats'),

	match = new TennisMatch(playerOne, playerTwo, () => {
		scoreboard!.innerHTML = match.getScoreboard();
		stats!.innerHTML = match.getStats();
	});
```

And then, proceed like e.g.:

```ts
match.start();
// match.play(); // It would failed (due to someone should be the opening server)
match.grantOpeningServeTo(playerTwo);
match.play();
match.logPointWonBy(playerOne);
match.logServeAsFault();
match.logPointWonBy(playerTwo);
match.logServeAsFault();
match.logServeAsFault();
match.logServeAsAce();
match.logPointWonBy(playerOne);
```

Now look at current content. What about it?

To speed it up, you can use the panel, obtained from `.getPanel()`.