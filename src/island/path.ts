/**
 * A* over the island grid: 8 directions, no cutting corners past something
 * solid. Returns the cells from (just after) the start to the goal, or null.
 */
export function findPath(from: { x: number; y: number }, to: { x: number; y: number }, walkable: (x: number, y: number) => boolean, limit = 400) {
  const key = (x: number, y: number) => x * 256 + y;
  const h = (x: number, y: number) => {
    const dx = Math.abs(x - to.x);
    const dy = Math.abs(y - to.y);
    return Math.max(dx, dy) + 0.41 * Math.min(dx, dy);
  };
  if (!walkable(to.x, to.y)) return null;
  const open: { x: number; y: number; g: number; f: number }[] = [{ x: from.x, y: from.y, g: 0, f: h(from.x, from.y) }];
  const came = new Map<number, number>();
  const best = new Map<number, number>([[key(from.x, from.y), 0]]);
  let steps = 0;
  while (open.length && steps++ < limit) {
    let i = 0;
    for (let k = 1; k < open.length; k++) if (open[k].f < open[i].f) i = k;
    const cur = open.splice(i, 1)[0];
    if (cur.x === to.x && cur.y === to.y) {
      const out: { x: number; y: number }[] = [];
      let k = key(cur.x, cur.y);
      const start = key(from.x, from.y);
      while (k !== start) {
        out.push({ x: Math.floor(k / 256), y: k % 256 });
        k = came.get(k)!;
      }
      return out.reverse();
    }
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (!walkable(nx, ny)) continue;
        if (dx && dy && (!walkable(cur.x + dx, cur.y) || !walkable(cur.x, cur.y + dy))) continue;
        const g = cur.g + (dx && dy ? 1.41 : 1);
        const nk = key(nx, ny);
        if (g >= (best.get(nk) ?? Infinity)) continue;
        best.set(nk, g);
        came.set(nk, key(cur.x, cur.y));
        open.push({ x: nx, y: ny, g, f: g + h(nx, ny) });
      }
  }
  return null;
}
