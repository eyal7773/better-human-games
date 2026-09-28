import type { RoomId } from '../../levels';
import type { Room, RoomSize } from '../kit';
import { peskyBox } from './box';
import { garden } from './garden';
import { kidsRoom } from './kids';
import { kitchen } from './kitchen';
import { livingRoom } from './living';
import { roof } from './roof';

const BUILDERS: Record<RoomId, (s: RoomSize) => Room> = {
  living: livingRoom,
  kitchen,
  kids: kidsRoom,
  garden,
  roof,
  box: peskyBox,
};

export function buildRoom(id: RoomId, size: RoomSize): Room {
  return BUILDERS[id](size);
}
