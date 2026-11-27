// A tiny seeded random generator (mulberry32) so a run — and a screenshot
// staged with ?shot=…&seed=… — plays the same way every time for the same
// seed. The game never uses Math.random for gameplay; only this.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An integer in [min, max] from the generator. */
export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** One element of `items`, picked by the generator. */
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}
