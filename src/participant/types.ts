import type { Show } from '../types';
import type Participant from './class';
import type Player from './player';
import type Team from './team';

export type AnyParticipant = Participant | Player | Team;

export type Id = Show<number>;

export type Name = Show<string>;