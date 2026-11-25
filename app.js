import { replay, name, sq, legalMoves, apply, toSAN, toUCI, toFEN, fromFEN, START_FEN, gameStatus } from "./engine.js";
import { OPERA } from "./sample.js";
import { svg } from "./pieces.js";
import { value, moveLoss, label, show, clamp, swingOf, explainAr, sacrificeCp, isBrilliant } from "./analysis.js";
import * as SF from "./sf.js";

const $ = (s) => document.querySelector(s);
const NOTES = "chess-replay-notes-v1", GAMES = "chess-games-v1";
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
let notes = read(NOTES);
let mode = "review", game, ply = 0, key = "", sel = null, flipped = false, pending = null, busy = false;
let evals = null; // analysis of the current game, or null
const DEPTH = 12, DEEP = 18;

const hash = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return String(h); };
const fresh = () => ({ headers: {}, positions: [{ state: fromFEN(START_FEN), move: null }], sans: [] });
function setGame(g) { game = g; key = hash(game.sans.join(" ")); ply = 0; sel = null; evals = null; $("#why").textContent = ""; }
function load(text) {
  try { setGame(replay(text)); $("#pgn-err").textContent = ""; const h = game.headers; $("#sub").textContent = h.White && h.Black ? `${h.White} vs ${h.Black}` : "Loaded game"; ply = 0; buildMoves(); render(); }
  catch (e) { $("#pgn-err").textContent = e.message; }
}
const cur = () => game.positions[ply].state;
function status() {
  const g = gameStatus(game.positions.slice(0, ply + 1)), st = cur();
  if (g.over) return `${g.reason}${g.result === "1/2-1/2" ? ", draw" : g.result === "1-0" ? ", White wins" : ", Black wins"}`;
  return (st.turn === "w" ? "White" : "Black") + " to move" + (g.check ? ", check" : "");
}
function buildMoves() {
  $("#moves").innerHTML = game.sans.map((s, i) => {
    const lb = evals && evals.labels[i + 1];
    return `${i % 2 === 0 ? `<span class="n">${i / 2 + 1}.</span>` : ""}<button data-ply="${i + 1}" class="${lb ? "m-" + lb.key : ""}">${s}</button>`;
  }).join("") || '<span class="mute">No moves yet</span>';
}
function render() {
  const { state, move } = game.positions[ply];
  const legal = mode !== "review" && ply === game.sans.length ? legalMoves(state) : [];
  const dests = sel !== null ? legal.filter((m) => m.from === sel).map((m) => m.to) : [];
  let html = "";
  for (let k = 0; k < 64; k++) {
    const i = flipped ? 63 - k : k, p = state.board[i], light = (Math.floor(i / 8) + i) % 2 === 0;
    const cls = ["sq", light ? "l" : "d", move && (i === move.from || i === move.to) ? "hl" : "", i === sel ? "sel" : "", dests.includes(i) ? (p ? "cap" : "dot") : ""].join(" ");
    const col = k % 8 === 0 ? `<b class="r">${8 - Math.floor(i / 8)}</b>` : "", fl = k >= 56 ? `<b class="f">${name(i)[0]}</b>` : "";
    html += `<button class="${cls}" data-sq="${i}" aria-label="${name(i)}${p ? " " + p : ""}">${col}${fl}${p ? svg(p) : ""}</button>`;
  }
  $("#board").innerHTML = html;
  document.querySelectorAll("#moves button").forEach((b) => b.classList.toggle("cur", Number(b.dataset.ply) === ply));
  const c = $("#moves .cur"); if (c) c.scrollIntoView({ block: "nearest" });
  $("#counter").textContent = `${ply} / ${game.sans.length}`;
  $("#status").textContent = status();
  $("#note-label").textContent = ply ? `Note for move ${Math.ceil(ply / 2)}${ply % 2 ? "" : "..."} ${game.sans[ply - 1]}` : "Start position";
  $("#note").disabled = !ply; $("#note").value = ply ? (notes[key] || {})[ply] || "" : "";
  engbox(); why();
}
const go = (n) => { ply = Math.max(0, Math.min(game.sans.length, n)); sel = null; render(); };

// ---- engine panel ----
function engbox() {
  const el = $("#engbox"); if (el.dataset.lock) return;
  if (mode === "friend") { el.innerHTML = ""; return; }
  if (mode === "cpu" && !SF.isLoaded()) return; // the download prompt is shown by setMode
  el.innerHTML = `<button id="an" ${busy || game.sans.length < 1 ? "disabled" : ""}>${evals ? "Analyze again" : "Analyze game"}${SF.isLoaded() ? "" : ` (downloads Stockfish, ${SF.sizeText()})`}</button><p class="mute small">Stockfish 19 lite, depth ${DEPTH} (suspected errors re-checked at depth ${DEEP}). Labels are a rough guide from the engine's score, not a verdict.</p>`;
}
async function ensure(btnText) {
  if (SF.isLoaded()) return true;
  const el = $("#engbox"); el.dataset.lock = "1";
  el.innerHTML = `<p>Loading engine, ${SF.sizeText()}…</p>`;
  try { await SF.load(); delete el.dataset.lock; return true; }
  catch (e) { delete el.dataset.lock; el.innerHTML = `<p class="err">${e.message}</p><button id="retry">Try again</button>`; return false; }
}
async function analyze() {
  if (busy) return; busy = true;
  if (!(await ensure())) { busy = false; return; }
  const n = game.positions.length, ev = new Array(n), best = new Array(n);
  const el = $("#engbox"); el.dataset.lock = "1";
  for (let i = 0; i < n; i++) {
    el.innerHTML = `<p>Analyzing ${i + 1} / ${n}…</p>`;
    const st = game.positions[i].state, legal = legalMoves(st);
    if (!legal.length) { ev[i] = gameStatus(game.positions.slice(0, i + 1)).reason === "Checkmate" ? { mate: 0, depth: 0 } : { cp: 0, depth: 0 }; best[i] = null; continue; }
    const r = await SF.search(toFEN(st), { depth: DEPTH }); ev[i] = r; best[i] = r.best;
  }
  const mk = () => {
    const labels = [];
    for (let i = 1; i < n; i++) {
      const m = game.positions[i].move, isTop = toUCI(m) === best[i - 1];
      const mated = ev[i].mate === 0;
      const loss = mated ? 0 : moveLoss(ev[i - 1], ev[i]);
      const mateFor = ev[i - 1].mate !== undefined && ev[i - 1].mate > 0;
      const sw = i >= 2 ? swingOf(ev[i - 2], ev[i - 1]) : 0;
      const sac = mated ? 0 : sacrificeCp(game.positions[i - 1].state, m), brill = !mated && isBrilliant({ loss, isTop, sac, evBefore: ev[i - 1], evAfter: ev[i] });
      labels[i] = { ...label(loss, isTop, mated, sw, mateFor, brill), sac, loss, swing: sw };
    }
    return labels;
  };
  let labels = mk();
  // A shallow search can misjudge a position (seen on the Opera Game). Re-search every position behind a suspected error (loss of 0.80+) deeper, then relabel.
  const redo = new Set();
  labels.forEach((l, i) => { if (l && l.loss >= 80) { redo.add(i - 1); redo.add(i); } });
  let k = 0;
  for (const j of [...redo].sort((x, y) => x - y)) {
    el.innerHTML = `<p>Re-checking suspected errors deeper ${++k} / ${redo.size}…</p>`;
    const st = game.positions[j].state;
    if (!legalMoves(st).length) continue;
    const r = await SF.search(toFEN(st), { depth: DEEP }); ev[j] = r; best[j] = r.best;
  }
  if (redo.size) labels = mk();
  evals = { ev, best, labels }; busy = false; delete el.dataset.lock; buildMoves(); render();
}
function why() {
  const el = $("#why");
  if (!evals || !ply) { el.innerHTML = evals ? '<p class="mute small">Pick a move to see the engine\'s view.</p>' : ""; return; }
  const lb = evals.labels[ply], prev = game.positions[ply - 1].state, e = evals.ev[ply], bu = evals.best[ply - 1];
  let alt = "";
  if (bu && !lb.key.match(/top|great|brill|mate/)) { const bm = legalMoves(prev).find((m) => toUCI(m) === bu); if (bm) alt = ` The engine preferred <b>${toSAN(prev, bm)}</b> here.`; }
  const sc = e.mate === 0 ? "Checkmate" : show(e, game.positions[ply].state.turn);
  let ex = "";
  if (!lb.key.match(/mate/) || true) {
    const st = game.positions[ply].state, mv = game.positions[ply].move;
    const bm = bu && legalMoves(prev).find((m) => toUCI(m) === bu), rb = evals.best[ply], rm = rb && legalMoves(st).find((m) => toUCI(m) === rb);
    const capOf = (state, m) => (m && state.board[m.to] ? state.board[m.to] : "");
    ex = `<p dir="rtl" lang="ar" class="ar">${explainAr({ lb, loss: lb.loss, swing: lb.swing || 0, sacCp: lb.sac || 0, evBefore: evals.ev[ply - 1], evAfter: e, bestSan: bm && !lb.key.match(/top|great|brill|mate/) ? toSAN(prev, bm) : "", replySan: rm && !lb.key.match(/top|great|brill|mate|exc|good/) ? toSAN(st, rm) : "", replyCaptures: capOf(st, rm), moveCaptures: capOf(prev, mv) })}</p>`;
  }
  el.innerHTML = ex + `<p><span class="tag t-${lb.key}">${lb.text}</span> ${game.sans[ply - 1]}. Evaluation after the move: <b>${sc}</b> (White's view${e.depth ? `, depth ${e.depth}` : ""}).${alt}${lb.key === "top" || lb.key === "great" || lb.key === "brill" || lb.key === "mate" ? "" : ` Estimated loss about ${(lb.loss / 100).toFixed(2)} pawns.`}</p>`;
}

// ---- play ----
function startPlay() {
  setGame(fresh()); $("#sub").textContent = mode === "cpu" ? "You vs Stockfish" : "Two players, one device"; buildMoves(); render();
  if (mode === "cpu" && human() === "b") cpuMove();
}
const human = () => $("#side").value;
function canMove() { return mode !== "review" && ply === game.sans.length && !gameStatus(game.positions).over && !(mode === "cpu" && cur().turn !== human()) && !busy; }
function play(m) {
  const st = cur(); game.sans.push(toSAN(st, m)); game.positions.push({ state: apply(st, m), move: m });
  evals = null; ply = game.sans.length; sel = null; key = hash(game.sans.join(" ")); buildMoves(); render();
  if (mode === "cpu" && !gameStatus(game.positions).over && cur().turn !== human()) cpuMove();
}
async function cpuMove() {
  busy = true; $("#status").textContent = "Computer is thinking…";
  const lv = { easy: { skill: 2, depth: 5 }, mid: { skill: 10, movetime: 400 }, hard: { skill: 20, movetime: 1000 } }[$("#level").value];
  const r = await SF.search(toFEN(cur()), lv); busy = false;
  const m = legalMoves(cur()).find((x) => toUCI(x) === r.best);
  if (m && mode === "cpu") play(m);
}
$("#board").onclick = (e) => {
  const b = e.target.closest("[data-sq]"); if (!b || !canMove()) return;
  const i = Number(b.dataset.sq), st = cur(), p = st.board[i];
  const mine = p && (p === p.toUpperCase()) === (st.turn === "w");
  if (sel !== null) {
    const ms = legalMoves(st).filter((m) => m.from === sel && m.to === i);
    if (ms.length > 1) { pending = ms; return promo(); }
    if (ms.length === 1) return play(ms[0]);
  }
  sel = mine ? i : null; render();
};
function promo() {
  const el = $("#promo"), white = cur().turn === "w"; el.hidden = false;
  el.innerHTML = "<span>Promote to</span>" + ["Q", "R", "B", "N"].map((t) => `<button data-p="${t}" aria-label="${t}">${svg(white ? t : t.toLowerCase())}</button>`).join("");
}
$("#promo").onclick = (e) => { const b = e.target.closest("[data-p]"); if (!b) return; const m = pending.find((x) => x.promo === b.dataset.p); $("#promo").hidden = true; pending = null; play(m); };

// ---- modes and wiring ----
async function setMode(m) {
  mode = m; busy = false;
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  $("#nav").hidden = false; $("#playbar").hidden = m === "review"; $("#cpuopts").hidden = m !== "cpu";
  const el = $("#engbox"); delete el.dataset.lock;
  if (m === "review") { load(OPERA); return; }
  if (m === "cpu" && !SF.isLoaded()) {
    setGame(fresh()); buildMoves(); render();
    el.innerHTML = `<p>Playing the computer needs the Stockfish 19 engine. One-time download: <b>${SF.sizeText()}</b>.</p><button id="dl">Download and play</button>`; return;
  }
  startPlay();
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.id === "an") analyze();
  if (t.id === "retry") { if (mode === "cpu") { if (await ensure()) startPlay(); } else analyze(); }
  if (t.id === "dl") { if (await ensure()) { $("#engbox").innerHTML = ""; startPlay(); } }
  if (t.dataset.mode) setMode(t.dataset.mode);
});
$("#first").onclick = () => go(0); $("#prev").onclick = () => go(ply - 1);
$("#next").onclick = () => go(ply + 1); $("#last").onclick = () => go(game.sans.length);
$("#moves").onclick = (e) => { if (e.target.dataset.ply) go(Number(e.target.dataset.ply)); };
$("#flip").onclick = () => { flipped = !flipped; render(); };
$("#newgame").onclick = () => { if (mode === "cpu" && !SF.isLoaded()) return; startPlay(); };
$("#side").onchange = () => { flipped = human() === "b"; if (SF.isLoaded()) startPlay(); };
$("#level").onchange = () => {};
$("#undo").onclick = () => {
  if (busy) return; const n = mode === "cpu" ? 2 : 1;
  for (let k = 0; k < n && game.sans.length; k++) { game.sans.pop(); game.positions.pop(); }
  if (mode === "cpu" && game.sans.length === 0 && human() === "b") { /* computer opens again */ ply = 0; evals = null; buildMoves(); render(); cpuMove(); return; }
  ply = game.sans.length; evals = null; sel = null; buildMoves(); render();
};
document.addEventListener("keydown", (e) => {
  if (/TEXTAREA|SELECT|INPUT/.test(e.target.tagName)) return;
  if (e.key === "ArrowRight") go(ply + 1); else if (e.key === "ArrowLeft") go(ply - 1);
  else if (e.key === "Home") go(0); else if (e.key === "End") go(game.sans.length);
});
$("#note").oninput = (e) => {
  notes[key] = notes[key] || {};
  if (e.target.value) notes[key][ply] = e.target.value; else delete notes[key][ply];
  localStorage.setItem(NOTES, JSON.stringify(notes)); $("#saved").textContent = "Saved";
};
function pgnOf() {
  const h = game.headers, r = gameStatus(game.positions).result || "*";
  let mv = ""; game.sans.forEach((s, i) => { mv += (i % 2 ? "" : `${i / 2 + 1}. `) + s + " "; });
  return `[Event "${h.Event || "Casual game"}"]\n[White "${h.White || "White"}"]\n[Black "${h.Black || "Black"}"]\n[Result "${r}"]\n\n${mv}${r}`;
}
function games() {
  const g = read(GAMES), ids = Object.keys(g).filter((id) => g[id] && g[id].title);
  $("#games").innerHTML = ids.length ? "<h2>Saved games</h2>" + ids.map((id) => `<div class="g"><button data-gid="${id}" class="ghost">${g[id].title}</button><button data-del="${id}" class="ghost" aria-label="Delete">✕</button></div>`).join("") : "";
}
$("#load").onclick = () => { if ($("#pgn").value.trim()) { setMode("review").then?.(); load($("#pgn").value); } };
$("#sample").onclick = () => { $("#pgn").value = ""; setMode("review"); };
$("#save").onclick = () => {
  if (!game.sans.length) return; const g = read(GAMES), id = "g" + hash(game.sans.join(" "));
  g[id] = { title: `${game.headers.White || "White"} vs ${game.headers.Black || "Black"} (${game.sans.length} moves)`, pgn: pgnOf() };
  localStorage.setItem(GAMES, JSON.stringify(g)); games();
};
$("#games").onclick = (e) => {
  const g = read(GAMES);
  if (e.target.dataset.gid) { mode = "review"; setMode("review"); load(g[e.target.dataset.gid].pgn); }
  if (e.target.dataset.del) { delete g[e.target.dataset.del]; localStorage.setItem(GAMES, JSON.stringify(g)); games(); }
};
window.__chess = { get game() { return game; } };
games(); setMode("review");
