import { test } from "node:test";
import assert from "node:assert/strict";
import { fromFEN, legalMoves, replay, toUCI } from "./engine.js";
import { sacrificeCp, isBrilliant } from "./analysis.js";
const mv = (st, u) => legalMoves(st).find((m) => toUCI(m) === u);
const OPERA = `1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`;
test("Qb8+ in the Opera game gives up a queen (about 9 pawns)", () => {
  const g = replay(OPERA), i = g.sans.indexOf("Qb8+");
  const sac = sacrificeCp(g.positions[i].state, g.positions[i + 1].move);
  assert.equal(sac, 900);
});
test("a defended pawn push is not a sacrifice", () => assert.equal(sacrificeCp(fromFEN("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"), mv(fromFEN("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"), "e2e4")), 0));
test("a trade of equal pieces is not a sacrifice", () => {
  const st = fromFEN("4k3/8/3n4/8/8/8/8/3QK3 w - - 0 1"); // Nd2-b3? use Qxd6 style: queen takes defended-free knight => no loss
  assert.equal(sacrificeCp(st, mv(st, "d1d6")), 0);
});
test("queen to a square attacked by a pawn is a sacrifice of a queen", () => {
  const st = fromFEN("4k3/8/2p5/8/8/8/8/3QK3 w - - 0 1");
  assert.equal(sacrificeCp(st, mv(st, "d1d2")), 0);
  assert.equal(sacrificeCp(st, mv(st, "d1d5")), 900);
});
const cp = (n) => ({ cp: n });
test("brilliant: top move, 9-pawn sac, still better, not crushing before", () =>
  assert.equal(isBrilliant({ loss: 0, isTop: true, sac: 900, evBefore: cp(200), evAfter: cp(-150) }), true));
test("not brilliant: no sacrifice", () => assert.equal(isBrilliant({ loss: 0, isTop: true, sac: 0, evBefore: cp(200), evAfter: cp(-150) }), false));
test("not brilliant: sacrifice but not near-top", () => assert.equal(isBrilliant({ loss: 120, isTop: false, sac: 900, evBefore: cp(200), evAfter: cp(-150) }), false));
test("not brilliant: sacrifice leaves mover worse", () => assert.equal(isBrilliant({ loss: 0, isTop: true, sac: 900, evBefore: cp(0), evAfter: cp(300) }), false));
test("not brilliant: already crushing (+8) before", () => assert.equal(isBrilliant({ loss: 0, isTop: true, sac: 900, evBefore: cp(800), evAfter: cp(-700) }), false));
test("forced-mate sacrifice that is the engine's top move counts", () => assert.equal(isBrilliant({ loss: 0, isTop: true, sac: 900, evBefore: { mate: 2 }, evAfter: { mate: -1 } }), true));
