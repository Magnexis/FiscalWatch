# Magnexis FiscalWatch

A Windows-first, local-first desktop research workspace for the **Magnexis Government Fiscal Accountability Initiative**. Built with Tauri 2, React, strict TypeScript, Rust and SQLite. The companion website is a static GitHub Pages publication, not the application.

The initial mission is to independently verify $100 million in potential annual government savings. **Current independently verified annual savings: $0.** Five source-checked GAO actions, historical CBO comparisons and three real bounded public-data extracts ship with the pilot. Nothing here establishes fraud, policy adoption or realized savings.

## Run on Windows

Download `docs/downloads/FiscalWatch-windows-x64.exe` and compare its SHA-256 with `docs/downloads/SHA256SUMS.txt`. The portable research build is unsigned, requires Microsoft Edge WebView2 and does not need a Magnexis account. No installer, auto-updater or telemetry is included.

The desktop app supports evidence review, source links, local SQLite notes, official API refresh, validated snapshot import, CSV export, review backup/restore, historical policy comparison, and bundled reports. Click **Refresh official extract** to fetch a bounded selection for the selected fiscal year. Network failure preserves cached data. Browser development preview disables native refresh and uses localStorage for notes; production is the native app.

## Development

Requires Node 22+, npm, Rust stable, Windows C++ build tools and WebView2. Other OS builds are not verified.

```powershell
npm ci
npm run desktop:dev
```

```powershell
npm test
python -m unittest discover -s tests -p test_*.py
npm run typecheck
cargo test --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml live_public_connectors -- --ignored --nocapture
npx tsx scripts/render-reports.ts
npm run desktop:build
```

Build output: `src-tauri/target/release/magnexis-fiscalwatch.exe`. `npm run dev` runs the browser development preview at `http://127.0.0.1:1437`. The generated frontend is in `desktop-dist`; do not serve it as the public companion site.

## Public data

```powershell
python scripts/refresh_data.py ct --year 2026 --limit 1000
python scripts/refresh_data.py usaspending --year 2026 --limit 100 --kind contract
python scripts/refresh_data.py usaspending --year 2026 --limit 100 --kind grant
npx tsx scripts/render-reports.ts
```

The Python refresh utility uses only the standard library. It downloads official public data without API keys. Extracts include the exact query, retrieval time, coverage, hash basis and SHA-256. Native refresh hashes normalized returned JSON; Python refresh hashes raw response bytes. These hashes are provenance aids, not signatures or source authenticity guarantees.

The `live_public_connectors` test is opt-in and makes real requests; ordinary Rust tests remain offline. The initial live test received 1,000 CT records, 100 contracts and 100 grants through the same Rust command used by the desktop refresh button.

CT uses dataset `ajdm-rvz7`, FY2026 and the latest 1,000 payment-distribution rows. USAspending selects the top 100 matching awards per kind with CT place of performance. Award amounts are award-level obligations, not state payments or necessarily obligations incurred within the filter window. Federal and state amounts must not be summed. No random-sample or statewide inference is supported. Multi-page federal ingestion is not implemented.

GAO's bulk recommendation CSV returned HTTP 403 during initial acquisition. The curated five-action register links to individual official recommendation pages; it is not a full ingestion of all open GAO actions.

## Persistence and privacy

Desktop data lives in the OS local application data directory for `com.magnexis.fiscalwatch`, in `fiscalwatch.sqlite3`. It is not encrypted. No cloud sync or authentication is required. Avoid storing private tax data, allegations or constituent details in shared exports. Public Pages documents contain no personal correspondence or constituent address.

## Static GitHub Pages

The tracked `docs/` folder is a buildless static site with no analytics, form submission or remote database. Publish the `main` branch `/docs` folder using GitHub Pages settings. No custom workflow, paid hosting, Sites deployment or cloud backend is required. Run the report generator before publishing research changes; copy the verified Windows build and checksum into `docs/downloads/` when updating the binary.

## Research status and limits

- Source confirmation is not independent verification of fiscal impact.
- Historical CBO estimates require a current-law score and new start date.
- Repeated invoice patterns may be legitimate distribution lines. Candidate counts are not recoverable dollars.
- No invoice-document reconciliation or independent fiscal review has yet occurred.
- No real savings, government endorsement, adoption or submission is inferred by the software.
- Outreach is conducted separately; the local follow-up ledger never sends messages.
- Windows x64 is the only packaged target. The build is unsigned and has no updater.

See [fiscal report](docs/fiscal-impact-report.html), [architecture](ARCHITECTURE.md), [security](SECURITY.md), [contributing](CONTRIBUTING.md) and [changelog](CHANGELOG.md). Software is MIT licensed; upstream data and reports retain their original terms.
