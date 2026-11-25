# Chess Studio

Review a game, get engine-based move feedback, or play (against Stockfish, or a friend on the same device). Runs in the browser. Built with AI assistance.

Live: https://abdalhadymahmoud9-crypto.github.io/chess-replay/

- Rules: castling, en passant, promotion, check, checkmate, stalemate, insufficient material, threefold repetition, fifty-move rule. Tests: `node --test`.
- Engine: Stockfish 19 lite (single thread), downloaded only when you click Analyze or Play, with the exact size shown first (1.87 MB).
- Move labels (Great, Best, Excellent, Good, Inaccuracy, Mistake, Blunder) come from the change in engine score at the shown depth (centipawn loss thresholds 10/30/80/200). Great means the engine's top move that also punishes a costly previous move (swing of 1.5 pawns or more) or keeps a forced mate. The whole game is searched at depth 12; any position behind a suspected error (loss of 0.80 pawns or more) is re-searched at depth 18 and relabelled, because shallow depth 12 gave a wrong score on one Opera Game position (Stockfish chose a losing reply at depth 12-14 and the correct one from depth 16). Brilliant is our own bounded rule, not Chess.com's: the engine's top move (or within 0.10 pawns of it) that gives up at least 2 pawns of material in a static exchange on its destination square, after which the mover is about equal or better (eval at least -0.50), and was not already clearly winning (below +6.00; a forced-mate sacrifice that is the engine's top move also counts). It is rare by design and can miss quiet or long-term sacrifices. These labels are not Chess.com's algorithm. They are a heuristic, not a human verdict.
- Arabic explanation per move is built from engine numbers only (score before and after, the engine's preferred move, the opponent's best reply, whether a piece is captured). No language model is used.
- Optional Google sign-in syncs notes and saved games across devices.
- No online multiplayer.

Licence: GPL-3.0, see `LICENSE` and `NOTICE.md`.
