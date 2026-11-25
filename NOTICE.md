# Licence and source notice

**Chess Studio** is licensed under the **GNU General Public License v3.0** (see `LICENSE`). Its own source code is every file in this repository. Built with AI assistance.

## Stockfish engine (loaded only when you click Analyze or Play computer)

The engine is not stored in this repository. When you ask for it, the page downloads two files from the npm package `stockfish@19.0.1` (served by unpkg.com), checks their exact size and SHA-256, and runs them in a Web Worker in your browser:

| File | Bytes | SHA-256 |
| --- | --- | --- |
| `stockfish-19-lite-single.js` | 28,230 | `ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a` |
| `stockfish-19-lite-single.wasm` | 1,845,971 | `ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de` |

Total 1,874,201 bytes. These are Stockfish.js 19 (Chess.com, LLC, Nathan Rugg), based on Stockfish 19 by the Stockfish developers, licensed GPL-3.0. Lite network by Chris Bao (sscg13).

### Corresponding source (GPL-3.0 section 6)

- Build of the files above, with build scripts: https://github.com/nmrugg/stockfish.js/tree/v19.0.1 (tag `v19.0.1`, commit `8d9ca57043594a8fa6ae0b73fb685d9105bf51df`)
- Release assets: https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.1
- Upstream Stockfish 19: https://github.com/official-stockfish/Stockfish/tree/sf_19
- Network source: https://github.com/sscg13/Stockfish/tree/sf19-1mb
- Written offer: if those links stop working, open an issue on this repository and the maintainer will provide the corresponding source for these exact files.

Stockfish's licence text is in `LICENSE` (identical to `Copying.txt` in the npm package).

## Other

Piece artwork is original to this project. The sign-in and sync code uses the Firebase JavaScript SDK (Apache-2.0), loaded from gstatic.com.
