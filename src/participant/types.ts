import type { Show } from '../types';
import Player from './player';
import Team from './team';

export type AnyParticipant = Player | Team;

export type Id = Show<number>;

export type Name = Show<string>;