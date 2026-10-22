# Validation — October 22, 2026

Completed checks for the initial research build:

- `npm run typecheck`: passed.
- `npm test`: eight behavioral tests passed, including exact-cent math, credits, repeat/conflict handling, protected identities, overlap checks, unsafe imports, CSV injection protection and all three real extracts.
- `python -m unittest discover -s tests -p test_*.py`: three tests passed for money precision, distribution identity and invalid query bounds.
- Rust unit tests cover persistence/reopening, namespaces, source URL restrictions, invalid fiscal queries and adoption evidence requirements.
- Opt-in Rust live connector test passed: 1,000 CT payments, 100 federal contracts and 100 federal grants. It uses the native command implementation, not a mock or the Python adapter.
- `npm run desktop:build`: produced an optimized Windows x64 portable executable.
- Windows startup smoke: process remained running and exposed a window titled `Magnexis FiscalWatch`; the owned process was then closed.
- Browser frontend smoke: evidence/data loaded, local note survived reload, empty search state rendered, and overlapping CBO alternatives produced the intended error. Native-size layout was visually inspected at 1440×940.
- GitHub Pages reported `built`; the public home, fiscal report, policy brief and checksum returned HTTP 200.

Limits: the browser persistence test exercises the development fallback; SQLite persistence is covered separately in Rust. Full end-to-end native webview interaction and an independent accessibility/security audit were not completed. The Windows executable is unsigned and requires WebView2. No government or fiscal-review outcome is implied by software checks.
