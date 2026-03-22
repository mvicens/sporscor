export type ConsoleMethod = {
	[K in keyof Console]: Console[K] extends (msg: string) => void ? K : never
}[Exclude<keyof Console, 'table'>];