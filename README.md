# Chess Replay

Paste a PGN and step through the game on a board, with a note field for every move. Comes with Morphy's "Opera Game" as a sample. Notes are saved in your browser per game. Arrow keys step through moves.

## Run / test
`python3 -m http.server`, open http://localhost:8000. Tests: `npm test` (Node 18+).

## How it works
- `engine.js`: a small rules engine (legal moves, check, castling, en passant, promotion) used to turn PGN move text (SAN) into positions. Illegal or unreadable moves are reported instead of guessed.
- `app.js`: board drawing, controls, notes.
- `engine.test.js`: tests, including a full replay of the Opera Game to checkmate.

## Limits
PGN comments and variations are ignored, not shown. No engine analysis. Only the main line of one game is loaded. Draw rules (repetition, 50 moves) are not tracked.

## Credits
Built with AI assistance.
