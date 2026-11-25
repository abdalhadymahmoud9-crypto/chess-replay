// Minimal chess rules engine: enough to replay a PGN with legal-move checking.
// Board: array of 64, index = rank_from_top * 8 + file. Uppercase = white, lowercase = black, "" = empty.
export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function fromFEN(fen) {
  const [placement, turn, castle, ep] = fen.split(" ");
  const board = [];
  for (const ch of placement.replace(/\//g, "")) {
    if (/\d/.test(ch)) for (let i = 0; i < Number(ch); i++) board.push("");
    else board.push(ch);
  }
  if (board.length !== 64) throw new Error("Bad FEN");
  return { board, turn, castle: castle === "-" ? "" : castle, ep: ep === "-" ? -1 : sq(ep) };
}
export const sq = (name) => (8 - Number(name[1])) * 8 + (name.charCodeAt(0) - 97);
export const name = (i) => String.fromCharCode(97 + (i % 8)) + (8 - Math.floor(i / 8));
const isWhite = (p) => p !== "" && p === p.toUpperCase();
const colorOf = (p) => (isWhite(p) ? "w" : "b");

const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]], ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function attacked(board, target, byColor) {
  const tr = Math.floor(target / 8), tc = target % 8;
  const at = (r, c) => (r < 0 || r > 7 || c < 0 || c > 7 ? null : board[r * 8 + c]);
  const mine = (p, t) => p && colorOf(p) === byColor && p.toUpperCase() === t;
  const pr = byColor === "w" ? 1 : -1; // white pawns attack upward, so they sit one rank below the target
  for (const dc of [-1, 1]) if (mine(at(tr + pr, tc + dc), "P")) return true;
  for (const [dr, dc] of KN) if (mine(at(tr + dr, tc + dc), "N")) return true;
  for (const [dr, dc] of KG) if (mine(at(tr + dr, tc + dc), "K")) return true;
  for (const [dirs, kinds] of [[DIAG, "BQ"], [ORTH, "RQ"]])
    for (const [dr, dc] of dirs) {
      let r = tr + dr, c = tc + dc;
      while (at(r, c) === "") { r += dr; c += dc; }
      const p = at(r, c);
      if (p && colorOf(p) === byColor && kinds.includes(p.toUpperCase())) return true;
    }
  return false;
}
export const inCheck = (st, color = st.turn) => {
  const k = st.board.indexOf(color === "w" ? "K" : "k");
  return k >= 0 && attacked(st.board, k, color === "w" ? "b" : "w");
};

function pseudo(st) {
  const { board, turn, castle, ep } = st, out = [];
  const push = (from, to, extra = {}) => out.push({ from, to, ...extra });
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || colorOf(p) !== turn) continue;
    const t = p.toUpperCase(), r = Math.floor(i / 8), c = i % 8;
    if (t === "P") {
      const dir = turn === "w" ? -1 : 1, start = turn === "w" ? 6 : 1, last = turn === "w" ? 0 : 7;
      const add = (to, extra) => {
        if (Math.floor(to / 8) === last) for (const pr of "QRBN") push(i, to, { ...extra, promo: pr });
        else push(i, to, extra);
      };
      const one = i + dir * 8;
      if (board[one] === "") {
        add(one);
        if (r === start && board[one + dir * 8] === "") push(i, one + dir * 8, { double: true });
      }
      for (const dc of [-1, 1]) {
        const cc = c + dc; if (cc < 0 || cc > 7) continue;
        const to = one + dc;
        if (board[to] && colorOf(board[to]) !== turn) add(to, { capture: true });
        else if (to === ep) push(i, to, { capture: true, enPassant: true });
      }
    } else if (t === "N" || t === "K") {
      for (const [dr, dc] of t === "N" ? KN : KG) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
        const to = rr * 8 + cc;
        if (!board[to] || colorOf(board[to]) !== turn) push(i, to, { capture: !!board[to] });
      }
      if (t === "K") {
        const home = turn === "w" ? 60 : 4, opp = turn === "w" ? "b" : "w";
        if (i === home && !attacked(board, home, opp)) {
          const ks = turn === "w" ? "K" : "k", qs = turn === "w" ? "Q" : "q", rook = turn === "w" ? "R" : "r";
          if (castle.includes(ks) && board[home + 1] === "" && board[home + 2] === "" && board[home + 3] === rook &&
              !attacked(board, home + 1, opp) && !attacked(board, home + 2, opp)) push(i, home + 2, { castle: "K" });
          if (castle.includes(qs) && board[home - 1] === "" && board[home - 2] === "" && board[home - 3] === "" && board[home - 4] === rook &&
              !attacked(board, home - 1, opp) && !attacked(board, home - 2, opp)) push(i, home - 2, { castle: "Q" });
        }
      }
    } else {
      const dirs = t === "B" ? DIAG : t === "R" ? ORTH : [...DIAG, ...ORTH];
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
          const to = rr * 8 + cc;
          if (!board[to]) push(i, to);
          else { if (colorOf(board[to]) !== turn) push(i, to, { capture: true }); break; }
          rr += dr; cc += dc;
        }
      }
    }
  }
  return out;
}

export function apply(st, m) {
  const board = st.board.slice();
  const p = board[m.from];
  board[m.to] = m.promo ? (isWhite(p) ? m.promo : m.promo.toLowerCase()) : p;
  board[m.from] = "";
  if (m.enPassant) board[m.to + (st.turn === "w" ? 8 : -8)] = "";
  if (m.castle === "K") { board[m.to - 1] = board[m.to + 1]; board[m.to + 1] = ""; }
  if (m.castle === "Q") { board[m.to + 1] = board[m.to - 2]; board[m.to - 2] = ""; }
  let castle = st.castle;
  const strip = (chars) => { for (const ch of chars) castle = castle.replace(ch, ""); };
  if (p === "K") strip("KQ"); if (p === "k") strip("kq");
  for (const [s, ch] of [[63, "K"], [56, "Q"], [7, "k"], [0, "q"]]) if (m.from === s || m.to === s) strip(ch);
  const ep = m.double ? (m.from + m.to) / 2 : -1;
  return { board, turn: st.turn === "w" ? "b" : "w", castle, ep };
}

export function legalMoves(st) {
  return pseudo(st).filter((m) => !inCheck(apply(st, m), st.turn));
}

export function toSAN(st, m, legal = legalMoves(st)) {
  const p = st.board[m.from], t = p.toUpperCase();
  let s;
  if (m.castle) s = m.castle === "K" ? "O-O" : "O-O-O";
  else {
    s = t === "P" ? (m.capture ? name(m.from)[0] : "") : t;
    if (t !== "P") {
      const others = legal.filter((o) => o.from !== m.from && o.to === m.to && st.board[o.from] === p);
      if (others.length) {
        const sameFile = others.some((o) => o.from % 8 === m.from % 8), sameRank = others.some((o) => Math.floor(o.from / 8) === Math.floor(m.from / 8));
        s += !sameFile ? name(m.from)[0] : !sameRank ? name(m.from)[1] : name(m.from);
      }
    }
    if (m.capture) s += "x";
    s += name(m.to);
    if (m.promo) s += "=" + m.promo;
  }
  const next = apply(st, m);
  if (inCheck(next)) s += legalMoves(next).length ? "+" : "#";
  return s;
}

export function parseSAN(st, raw) {
  const san = raw.replace(/[+#!?]/g, "");
  const legal = legalMoves(st);
  if (/^[O0]-[O0]-[O0]$/.test(san)) return legal.find((m) => m.castle === "Q") || fail(raw);
  if (/^[O0]-[O0]$/.test(san)) return legal.find((m) => m.castle === "K") || fail(raw);
  const mt = san.match(/^([NBRQK])?([a-h])?([1-8])?x?([a-h][1-8])(?:=?([NBRQ]))?$/);
  if (!mt) fail(raw);
  const [, piece = "P", file, rank, dest, promo] = mt, to = sq(dest);
  const found = legal.filter((m) =>
    m.to === to && st.board[m.from].toUpperCase() === piece && (m.promo || undefined) === promo &&
    (!file || name(m.from)[0] === file) && (!rank || name(m.from)[1] === rank));
  if (found.length !== 1) fail(raw);
  return found[0];
}
function fail(san) { throw new Error(`Illegal or unreadable move: ${san}`); }

export function parsePGN(text) {
  const headers = {};
  for (const m of text.matchAll(/\[(\w+)\s+"([^"]*)"\]/g)) headers[m[1]] = m[2];
  let body = text.replace(/\[[^\]]*\]/g, " ").replace(/\{[^}]*\}/g, " ").replace(/;[^\n]*/g, " ");
  let prev;
  do { prev = body; body = body.replace(/\([^()]*\)/g, " "); } while (body !== prev);
  const tokens = body.replace(/\$\d+/g, " ").replace(/\d+\.(\.\.)?/g, " ").split(/\s+/).filter(Boolean)
    .filter((t) => !["1-0", "0-1", "1/2-1/2", "*"].includes(t));
  return { headers, tokens, result: headers.Result || "*" };
}

// Returns positions[0..n] (start plus after each move) and the SAN list.
export function replay(pgnText) {
  const { headers, tokens } = parsePGN(pgnText);
  let st = fromFEN(headers.FEN || START_FEN);
  const positions = [{ state: st, move: null }], sans = [];
  for (const tok of tokens) {
    const m = parseSAN(st, tok);
    sans.push(toSAN(st, m));
    st = apply(st, m);
    positions.push({ state: st, move: m });
  }
  return { headers, positions, sans };
}
