# Chess Studio

Review a game, get engine-based move feedback, or play (against Stockfish, or a friend on the same device). Runs in the browser. Built with AI assistance.

Live: https://abdalhadymahmoud9-crypto.github.io/chess-replay/

- Rules: castling, en passant, promotion, check, checkmate, stalemate, insufficient material, threefold repetition, fifty-move rule. Tests: `node --test`.
- Engine: Stockfish 19 lite (single thread), downloaded only when you click Analyze or Play, with the exact size shown first (1.87 MB).
- Move labels (Great, Best, Excellent, Good, Inaccuracy, Mistake, Blunder) come from the change in engine score at the shown depth (centipawn loss thresholds 10/30/80/200). Great means the engine's top move that also punishes a costly previous move (swing of 1.5 pawns or more) or keeps a forced mate. There is no Brilliant label: it would need sacrifice detection this project does not do, and these labels are not Chess.com's algorithm. They are a heuristic, not a human verdict.
- Arabic explanation per move is built from engine numbers only (score before and after, the engine's preferred move, the opponent's best reply, whether a piece is captured). No language model is used.
- Optional Google sign-in syncs notes and saved games across devices.
- No online multiplayer.

Licence: GPL-3.0, see `LICENSE` and `NOTICE.md`.
