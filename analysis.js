// Pure helpers for turning engine scores into labels. Scores are from the side to move's view.
export const MATE = 10000;
export const value = (s) => (s.mate !== undefined ? Math.sign(s.mate) * (MATE - Math.abs(s.mate)) : s.cp);
export const clamp = (v) => Math.max(-1500, Math.min(1500, v));
// evals[i] = score of position i (side to move). Move i is made from position i-1 by the side to move there.
// loss is in centipawns from the mover's point of view; mate scores are clamped so mate vs not-mate counts as a large swing.
export function moveLoss(before, after) { return Math.max(0, clamp(value(before)) - clamp(-value(after))); }
export function label(loss, isTop, mated) {
  if (mated) return { key: "mate", text: "Checkmate" };
  if (isTop) return { key: "top", text: "Engine's top choice" };
  if (loss <= 30) return { key: "good", text: "Solid" };
  if (loss <= 80) return { key: "inacc", text: "Inaccuracy" };
  if (loss <= 200) return { key: "mist", text: "Mistake" };
  return { key: "blun", text: "Blunder" };
}
// Display from White's view.
export function show(s, turn) {
  const w = turn === "w" ? 1 : -1;
  if (s.mate !== undefined) { const m = s.mate * w; return (m > 0 ? "White" : "Black") + " mates in " + Math.abs(m); }
  const v = (s.cp * w) / 100; return (v > 0 ? "+" : "") + v.toFixed(2);
}
