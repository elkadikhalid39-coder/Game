export const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
export const pick = (a, n) => shuffle(a).slice(0, n);
export const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const delay = (ms) => new Promise((r) => setTimeout(r, ms));
