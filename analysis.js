import { apply, legalMoves } from "./engine.js";
// Pure helpers for turning engine scores into labels. Scores are from the side to move's view.
export const MATE = 10000;
export const value = (s) => (s.mate !== undefined ? Math.sign(s.mate) * (MATE - Math.abs(s.mate)) : s.cp);
export const clamp = (v) => Math.max(-1500, Math.min(1500, v));
// evals[i] = score of position i (side to move). Move i is made from position i-1 by the side to move there.
// loss is in centipawns from the mover's point of view; mate scores are clamped so mate vs not-mate counts as a large swing.
export function moveLoss(before, after) { return Math.max(0, clamp(value(before)) - clamp(-value(after))); }
// swing = how much the opponent's previous move cost them (centipawns, mover's view); mateFor = mover had a forced mate.
// Cost of the opponent's last move to them, in centipawns from the next mover's view. before = score at i-2 (mover-to-be's opponent to move), after = score at i-1 (mover to move).
export const swingOf = (before, after) => Math.max(0, clamp(value(after)) - clamp(-value(before)));
const PV = { p: 100, n: 300, b: 300, r: 500, q: 900, k: 0 };
const pv = (c) => PV[String(c).toLowerCase()] || 0;
// Static exchange on one square: best material the side to move can win by capturing there, least valuable attacker first, floored at 0.
function see(st, to, depth = 0) {
  if (depth > 12 || !st.board[to]) return 0;
  const caps = legalMoves(st).filter((m) => m.to === to && st.board[m.to]);
  if (!caps.length) return 0;
  caps.sort((a, b) => pv(st.board[a.from]) - pv(st.board[b.from]));
  const m = caps[0];
  return Math.max(0, pv(st.board[to]) - see(apply(st, m), to, depth + 1));
}
// Material (centipawns) the mover gives up on the destination square if the opponent trades it off. Counts the capture made, then the exchange. 0 when nothing is given up.
export function sacrificeCp(st, m) {
  const got = st.board[m.to] ? pv(st.board[m.to]) : m.enPassant ? 100 : 0;
  return Math.max(0, see(apply(st, m), m.to) - got);
}
// "Brilliant" here is our own bounded rule, not Chess.com's: a top or near-top engine move that gives up at least 2 pawns of material in the exchange on its square,
// after which the mover is about equal or better (eval >= -0.50), and who was not already clearly winning (< +6.00, forced mate excepted when the move is the engine's top).
export function isBrilliant({ loss, isTop, sac, evBefore, evAfter }) {
  if (!(sac >= 200) || !(isTop || loss <= 10)) return false;
  if (clamp(-value(evAfter)) < -50) return false;
  if (evBefore.mate !== undefined && evBefore.mate > 0) return isTop;
  return clamp(value(evBefore)) < 600;
}
export function label(loss, isTop, mated, swing = 0, mateFor = false, brilliant = false) {
  if (mated) return { key: "mate", text: "Checkmate" };
  if (brilliant) return { key: "brill", text: "Brilliant" };
  if (isTop && (mateFor || swing >= 150)) return { key: "great", text: "Great" };
  if (isTop) return { key: "top", text: "Best" };
  if (loss <= 10) return { key: "exc", text: "Excellent" };
  if (loss <= 30) return { key: "good", text: "Good" };
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

// ---- Arabic explanation, built only from engine numbers and legal-move facts ----
const PIECE_AR = { p: "بيدق", n: "حصان", b: "فيل", r: "طابية", q: "وزير", k: "ملك" };
export const pieceAr = (c) => PIECE_AR[String(c).toLowerCase()] || "";
const L = (x) => `<bdi dir="ltr">${x}</bdi>`; // keeps signs, digits and SAN in left-to-right order inside Arabic text
const ar = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
// s is a score from the side to move's view; sign=+1 when that side is the mover, -1 otherwise. Output is from the mover's view.
export function scoreAr(s, sign) {
  if (s.mate !== undefined) { const m = s.mate * sign; return m === 0 ? "مات" : m > 0 ? `مات لصالحك في ${ar(Math.abs(m))}` : `مات ضدك في ${ar(Math.abs(m))}`; }
  const v = (s.cp * sign) / 100; return L((v > 0 ? "+" : v < 0 ? "\u2212" : "") + Math.abs(v).toFixed(2));
}
// info: { lb, loss, evBefore, evAfter, bestSan, replySan, replyCaptures (piece char or ""), moveCaptures (piece char or ""), swing }
export function explainAr(info) {
  const { lb, loss, evBefore, evAfter, bestSan, replySan, replyCaptures, moveCaptures } = info;
  const after = scoreAr(evAfter, -1), p = [];
  if (lb.key === "mate") return "كش مات. المباراة انتهت بالنقلة دي.";
  const cap = moveCaptures ? ` والنقلة بتاخد ${pieceAr(moveCaptures)}` : "";
  if (lb.key === "brill") p.push(`نقلة لامعة (حسب قاعدتنا البسيطة): ${info.sacCp >= 800 ? "تضحية بالوزير" : `تضحية بمادة تقريبا ${ar((info.sacCp / 100).toFixed(0))} بيادق`} لو الخصم أخدها، لكن المحرك بيعتبرها أفضل أو قريبة من الأفضل والتقييم بعدها ${after}${cap}.`);
  else if (lb.key === "great") p.push(`نقلة رائعة، هي أفضل نقلة عند المحرك${info.swing >= 150 ? ` وبتستغل خطأ الخصم السابق (التقييم اتحرك ${ar((info.swing / 100).toFixed(1))} بيدق لصالحك)` : " وبتحافظ على مات إجباري"}${cap}.`);
  else if (lb.key === "top") p.push(`أفضل نقلة حسب المحرك${cap}.`);
  else if (lb.key === "exc" || lb.key === "good") p.push(`${lb.key === "exc" ? "نقلة ممتازة" : "نقلة كويسة"}: خسارتها صغيرة (حوالي ${ar((loss / 100).toFixed(2))} بيدق)${cap}.`);
  else {
    const name = { inacc: "دقة ناقصة", mist: "غلطة", blun: "غلطة كبيرة" }[lb.key];
    p.push(`${name}: التقييم من وجهة نظرك نزل من ${scoreAr(evBefore, 1)} (مع أفضل لعب) إلى ${after} بعد نقلتك، يعني خسارة حوالي ${ar((loss / 100).toFixed(2))} بيدق${cap}.`);
    if (evBefore.mate !== undefined && evBefore.mate > 0 && !(evAfter.mate !== undefined && -evAfter.mate > 0)) p.push(`كان عندك مات إجباري وضاع.`);
    if (evAfter.mate !== undefined && evAfter.mate > 0) p.push(`النقلة دي بتسمح للخصم بمات.`);
    if (bestSan) p.push(`المحرك كان يفضّل ${L(bestSan)}.`);
    if (replySan) p.push(`أقوى رد للخصم بعد نقلتك: ${L(replySan)}${replyCaptures ? ` وبيأخد ${pieceAr(replyCaptures)} عندك` : ""}.`);
  }
  if (lb.key === "top" || lb.key === "exc" || lb.key === "good" || lb.key === "great") p.push(`التقييم بعدها ${after}.`);
  return p.join(" ");
}
