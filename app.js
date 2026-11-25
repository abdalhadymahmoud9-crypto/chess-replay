import { replay, name } from "./engine.js";
import { OPERA } from "./sample.js";

const GLYPH = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" };
const $ = (s) => document.querySelector(s);
const NOTES = "chess-replay-notes-v1";
let game, ply = 0, key = "";
let notes = (() => { try { return JSON.parse(localStorage.getItem(NOTES)) || {}; } catch { return {}; } })();

function hash(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return String(h); }

function load(text) {
  try {
    game = replay(text); key = hash(game.sans.join(" ")); ply = 0;
    $("#pgn-err").textContent = "";
    const h = game.headers;
    $("#title").textContent = h.White && h.Black ? `${h.White} vs ${h.Black}` : "Untitled game";
    $("#sub").textContent = [h.Event, h.Site, h.Date && h.Date.replace(/\.\?\?/g, ""), h.Result].filter(Boolean).join(" · ");
    buildMoves(); render();
  } catch (e) { $("#pgn-err").textContent = e.message; }
}

function buildMoves() {
  $("#moves").innerHTML = game.sans.map((s, i) =>
    `${i % 2 === 0 ? `<span class="n">${i / 2 + 1}.</span>` : ""}<button data-ply="${i + 1}">${s}</button>`).join("");
}

function render() {
  const { state, move } = game.positions[ply];
  let html = "";
  for (let i = 0; i < 64; i++) {
    const p = state.board[i], light = (Math.floor(i / 8) + i) % 2 === 0;
    const hl = move && (i === move.from || i === move.to) ? " hl" : "";
    const f = i % 8 === 0 ? `<b class="r">${8 - i / 8}</b>` : "", fl = i >= 56 ? `<b class="f">${name(i)[0]}</b>` : "";
    html += `<div class="sq ${light ? "l" : "d"}${hl}">${f}${fl}${p ? `<span class="pc ${p === p.toUpperCase() ? "w" : "b"}">${GLYPH[p.toUpperCase()]}</span>` : ""}</div>`;
  }
  $("#board").innerHTML = html;
  document.querySelectorAll("#moves button").forEach((b) => b.classList.toggle("cur", Number(b.dataset.ply) === ply));
  const cur = $("#moves .cur"); if (cur) cur.scrollIntoView({ block: "nearest" });
  $("#counter").textContent = `${ply} / ${game.sans.length}`;
  $("#note-label").textContent = ply ? `Note for move ${Math.ceil(ply / 2)}${ply % 2 ? "" : "..."} ${game.sans[ply - 1]}` : "Start position";
  $("#note").disabled = !ply;
  $("#note").value = ply ? (notes[key] || {})[ply] || "" : "";
}

const go = (n) => { ply = Math.max(0, Math.min(game.sans.length, n)); render(); };
$("#first").onclick = () => go(0);
$("#prev").onclick = () => go(ply - 1);
$("#next").onclick = () => go(ply + 1);
$("#last").onclick = () => go(game.sans.length);
$("#moves").onclick = (e) => { if (e.target.dataset.ply) go(Number(e.target.dataset.ply)); };
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "TEXTAREA") return;
  if (e.key === "ArrowRight") go(ply + 1); else if (e.key === "ArrowLeft") go(ply - 1);
  else if (e.key === "Home") go(0); else if (e.key === "End") go(game.sans.length);
});
$("#note").oninput = (e) => {
  notes[key] = notes[key] || {};
  if (e.target.value) notes[key][ply] = e.target.value; else delete notes[key][ply];
  localStorage.setItem(NOTES, JSON.stringify(notes));
  $("#saved").textContent = "Saved";
};
$("#load").onclick = () => { if ($("#pgn").value.trim()) load($("#pgn").value); };
$("#sample").onclick = () => { $("#pgn").value = ""; load(OPERA); };
load(OPERA);
