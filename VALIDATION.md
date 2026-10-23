# Validation — October 23, 2026

Completed checks for the 1.3.0 research build:

- `npm run typecheck`: passed.
- `npm test`: twelve behavioral tests passed, including exact-cent math, credits, repeat/conflict handling, protected identities, overlap checks, unsafe imports, all bundled extracts, research-readiness and debt-strategy behavior.
- `python -m unittest discover -s tests -p test_*.py`: three tests passed for money precision, distribution identity and invalid query bounds.
- Rust unit tests cover persistence/reopening, namespaces, source URL restrictions, invalid fiscal queries and adoption evidence requirements.
- Opt-in Rust live connector test passed: 1,000 CT payments, 100 federal contracts and 100 federal grants. It uses the native command implementation, not a mock or the Python adapter.
- `npm run desktop:build`: produced an optimized Windows x64 portable executable at `target/release/magnexis-fiscalwatch.exe`.
- `cargo test --release`: passed three native tests; two live-network tests remain explicitly ignored.
- The release executable copied to `docs/downloads/FiscalWatch-windows-x64.exe` has SHA-256 `fef118886901a29a37e65bc0a96eac7c51c1ba801232c7be06e09acbff278836`.
- Browser frontend smoke: evidence/data loaded, local note survived reload, empty search state rendered, and overlapping CBO alternatives produced the intended error. Native-size layout was visually inspected at 1440×940.
- GitHub Pages reported `built`; the public home, fiscal report, policy brief and checksum returned HTTP 200.

Limits: the browser persistence test exercises the development fallback; SQLite persistence is covered separately in Rust. Full end-to-end native webview interaction and an independent accessibility/security audit were not completed. The Windows executable is unsigned and requires WebView2. No government or fiscal-review outcome is implied by software checks.
