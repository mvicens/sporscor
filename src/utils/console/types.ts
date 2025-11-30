import type { Msg } from '../../types';

export type ConsoleMethod = {
	[K in keyof Console]: Console[K] extends (msg: Msg) => void ? K : never
}[Exclude<keyof Console, 'table'>];