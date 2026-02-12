import type { Show } from '../types';
import type Player from './player';
import type Team from './team';

export type AnyParticipant = Player | Team;

export type Id = Show<number>;

export type Name = Show<string>;