export enum Id {
	TotalPoints,

	// Basketball
	TwoPointersAttempted,
	TwoPointersMade,
	ThreePointersAttempted,
	ThreePointersMade,
	FreeThrowsAttempted,
	FreeThrowsMade,

	// Scored match
	ConsecutivePointsWon,
	MostConsecutivePointsWon,

	// Serve (scored m.)
	TotalServicePoints,
	Aces,
	ServiceErrors, // That loses point

	// Tennis
	PossibleBreakPoints,
	BreakPoints,
	FirstServesIn,
	FirstServePointsWon,
	TotalSecondServes,
	SecondServesIn,
	SecondServePointsWon,

	// Volleyball
	PointScoring,
	TotalReceptionPoints,
	SideOut
}