// Lazy loader for Stockfish.js 19.0.1 (lite, single-thread). Nothing is fetched until load() is called.
// Files come from unpkg (npm package "stockfish" 19.0.1), are checked for exact size and SHA-256, then run in a Worker.
const BASE = "https://unpkg.com/stockfish@19.0.1/bin/";
export const FILES = {
  js: { url: BASE + "stockfish-19-lite-single.js", size: 28230, sha: "ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a" },
  wasm: { url: BASE + "stockfish-19-lite-single.wasm", size: 1845971, sha: "ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de" },
};
export const TOTAL = FILES.js.size + FILES.wasm.size;
export const sizeText = () => `${(TOTAL / 1e6).toFixed(2)} MB (${TOTAL.toLocaleString("en-US")} bytes)`;
const hex = async (buf) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", buf))].map((b) => b.toString(16).padStart(2, "0")).join("");
let worker = null, ready = null, listeners = new Set();
export const isLoaded = () => !!ready;
function send(cmd) { worker.postMessage(cmd); }
function waitFor(test) { return new Promise((res) => { const f = (line) => { const r = test(line); if (r !== undefined) { listeners.delete(f); res(r); } }; listeners.add(f); }); }
export function load() {
  if (ready) return ready;
  ready = (async () => {
    const got = {};
    for (const [k, f] of Object.entries(FILES)) {
      const r = await fetch(f.url); if (!r.ok) throw new Error("Download failed (" + r.status + ")");
      const buf = await r.arrayBuffer();
      if (buf.byteLength !== f.size || (await hex(buf)) !== f.sha) throw new Error("Engine file did not match the expected version. Not started.");
      got[k] = buf;
    }
    const wasmUrl = URL.createObjectURL(new Blob([got.wasm], { type: "application/wasm" }));
    const jsUrl = URL.createObjectURL(new Blob([got.js], { type: "text/javascript" }));
    worker = new Worker(jsUrl + "#" + encodeURIComponent(wasmUrl));
    worker.onmessage = (e) => { const line = String(e.data); for (const f of [...listeners]) f(line); };
    const ok = waitFor((l) => (l === "uciok" ? true : undefined)); send("uci"); await ok;
    const rd = waitFor((l) => (l === "readyok" ? true : undefined)); send("isready"); await rd;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}
// Search one position. Returns score from the side to move's view: {cp} or {mate}, plus best move, depth, line.
let busy = Promise.resolve();
export function search(fen, { depth = 12, movetime = 0, skill = 20 } = {}) {
  const run = async () => {
    await load();
    send("ucinewgame"); send("setoption name Skill Level value " + skill); send("position fen " + fen);
    let last = {};
    const f = (line) => { if (!line.startsWith("info") || !/ score /.test(line) || / (lowerbound|upperbound)/.test(line)) return; const m = line.match(/score (cp|mate) (-?\d+)/), d = line.match(/ depth (\d+)/), p = line.match(/ pv (.*)$/); if (m) last = { [m[1]]: Number(m[2]), depth: d ? Number(d[1]) : 0, pv: p ? p[1] : "" }; };
    listeners.add(f);
    const done = waitFor((l) => (l.startsWith("bestmove") ? l.split(" ")[1] : undefined));
    send(movetime ? `go movetime ${movetime}` : `go depth ${depth}`);
    const best = await done; listeners.delete(f);
    return { ...last, best };
  };
  const p = busy.then(run, run); busy = p.catch(() => {}); return p;
}
