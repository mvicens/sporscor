export enum Sport {
	Basketball = 'basketball',
	Tennis = 'tennis',
	Volleyball = 'volleyball'
}

export enum Stage {
	Unstarted,

	// Inactive
	Preparing,
	AtRest,

	Playing,
	Finished
}

export enum RestType {
	// Scheduled
	breakPerPhase, // Intermission between games, sets, quarters…
	breakPerPoint,

	Timeout
}