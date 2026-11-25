import { test } from "node:test";
import assert from "node:assert/strict";
import { replay, fromFEN, START_FEN, legalMoves, inCheck, sq, parsePGN } from "./engine.js";

const OPERA = `[Event "Paris"][White "Morphy"][Black "Duke of Brunswick and Count Isouard"][Result "1-0"]
1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`;

test("start position has 20 legal moves", () => assert.equal(legalMoves(fromFEN(START_FEN)).length, 20));
test("Opera Game replays to checkmate with matching SAN", () => {
  const g = replay(OPERA);
  assert.equal(g.sans.length, 33);
  assert.equal(g.sans.at(-1), "Rd8#");
  const last = g.positions.at(-1).state;
  assert.equal(inCheck(last), true);
  assert.equal(legalMoves(last).length, 0);
});
test("castling moves both king and rook", () => {
  const g = replay(OPERA);
  const s = g.positions[23].state; // after 12.O-O-O (ply 23)
  assert.equal(s.board[sq("c1")], "K"); assert.equal(s.board[sq("d1")], "R");
});
test("en passant removes the captured pawn", () => {
  const g = replay("1. e4 a6 2. e5 d5 3. exd6");
  const s = g.positions.at(-1).state;
  assert.equal(s.board[sq("d5")], ""); assert.equal(s.board[sq("d6")], "P");
});
test("promotion", () => {
  const g = replay("1. a4 b5 2. axb5 a6 3. bxa6 Nc6 4. a7 Nb8 5. axb8=Q");
  assert.equal(g.positions.at(-1).state.board[sq("b8")], "Q");
  assert.equal(g.sans.at(-1), "axb8=Q");
});
test("comments, variations and NAGs are ignored", () => {
  const p = parsePGN("1. e4 {best by test} e5 (1... c5 2. Nf3) 2. Nf3 $1 *");
  assert.deepEqual(p.tokens, ["e4", "e5", "Nf3"]);
});
test("illegal move throws", () => {
  assert.throws(() => replay("1. e5"), /Illegal/);
  assert.throws(() => replay("1. e4 e5 2. Ke3"), /Illegal/);
});

import { moveLoss, label, show } from "./analysis.js";
import { gameStatus, toFEN, fromFEN as ff, START_FEN as SF, toUCI } from "./engine.js";
test("loss: mate missed is a blunder, mover view", () => {
  assert.ok(moveLoss({ mate: 2 }, { cp: 50 }) > 200); // had mate in 2, opponent (stm) now sees +50 for themselves
  assert.equal(moveLoss({ cp: 30 }, { cp: -30 }), 0);
  assert.equal(label(20, false, false).key, "good");
  assert.equal(show({ mate: 3 }, "b"), "Black mates in 3");
});
test("status: stalemate, insufficient material, FEN round trip", () => {
  const st = ff("7k/5Q2/6K1/8/8/8/8/8 b - -");
  assert.equal(gameStatus([{ state: st, move: null }]).reason, "Stalemate");
  assert.equal(gameStatus([{ state: ff("8/8/8/4k3/8/8/3K4/8 w - -"), move: null }]).reason, "Insufficient material");
  assert.equal(toFEN(ff(SF)).split(" ")[0], SF.split(" ")[0]);
});

import { explainAr, scoreAr } from "./analysis.js";
test("labels: great needs top move plus a swing or mate; excellent tier", () => {
  assert.equal(label(0, true, false, 200).key, "great");
  assert.equal(label(0, true, false, 20).key, "top");
  assert.equal(label(0, true, false, 0, true).key, "great");
  assert.equal(label(5, false, false).key, "exc");
  assert.equal(label(250, false, false).key, "blun");
});
test("arabic explanation uses engine numbers, best move and reply", () => {
  const txt = explainAr({ lb: { key: "blun" }, loss: 320, evBefore: { cp: 40 }, evAfter: { cp: 300 }, bestSan: "Nf3", replySan: "Qxd5", replyCaptures: "q", moveCaptures: "" });
  assert.match(txt, /غلطة كبيرة/); assert.match(txt, /Nf3/); assert.match(txt, /Qxd5/); assert.match(txt, /وزير/); assert.match(txt, /٣\.٢٠/);
});
test("arabic: missed mate and allowed mate are named", () => {
  assert.match(explainAr({ lb: { key: "blun" }, loss: 900, evBefore: { mate: 2 }, evAfter: { cp: 50 }, bestSan: "Qh7#" }), /مات إجباري/);
  assert.match(explainAr({ lb: { key: "blun" }, loss: 900, evBefore: { cp: 0 }, evAfter: { mate: 2 }, bestSan: "a3" }), /بتسمح للخصم بمات/);
  assert.equal(scoreAr({ mate: 3 }, -1), "مات ضدك في ٣");
});

test("arabic: scores and SAN are isolated LTR so the minus sign stays in front", () => {
  const txt = explainAr({ lb: { key: "mist" }, loss: 137, evBefore: { cp: -664 }, evAfter: { cp: 801 }, bestSan: "Qc5", replySan: "Bxf6+", replyCaptures: "n" });
  assert.match(txt, /<bdi dir="ltr">\u22126\.64<\/bdi>/); assert.match(txt, /<bdi dir="ltr">Bxf6\+<\/bdi>/); assert.match(txt, /<bdi dir="ltr">\u22128\.01<\/bdi>/);
});
