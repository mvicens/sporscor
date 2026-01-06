export enum Sport {
	Basketball,
	Tennis,
	Volleyball
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
	breakPerPhase, // Set, part…
	breakPerPoint,

	Timeout // Also short
}