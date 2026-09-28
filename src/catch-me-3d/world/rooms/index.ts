import type { RoomId } from '../../levels';
import type { Room, RoomSize } from '../kit';
import { kitchen } from './kitchen';
import { livingRoom } from './living';

const BUILDERS: Partial<Record<RoomId, (s: RoomSize) => Room>> = {
  living: livingRoom,
  kitchen,
};

export function buildRoom(id: RoomId, size: RoomSize): Room {
  return (BUILDERS[id] ?? livingRoom)(size);
}
