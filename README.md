# Magnexis FiscalWatch

[![Release](https://img.shields.io/badge/release-1.3.0-285CF0?style=flat-square)](CHANGELOG.md)
[![Desktop](https://img.shields.io/badge/desktop-Windows%20first-24C5BB?style=flat-square)](#run-on-windows)
[![Local first](https://img.shields.io/badge/data-local--first-8E5AE8?style=flat-square)](#persistence-and-privacy)
[![License](https://img.shields.io/badge/license-MIT-ff8d6b?style=flat-square)](LICENSE)
[![Tauri](https://img.shields.io/badge/built%20with-Tauri%202-ffc131?style=flat-square)](https://v2.tauri.app/)

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/fiscalwatch-logo-on-dark.svg">
    <img src="public/fiscalwatch-logo.svg" width="420" alt="Fiscal Watch logo — colorful rising bar and line chart mark with wordmark">
  </picture>
</p>

> **Release 1.3.0 — Government decision workspace.** Fiscal Watch turns source availability, scenario assumptions, review signals, and evidence gaps into concrete next actions without presenting a government-quality score or inventing fiscal results.

A Windows-first, local-first desktop research workspace for the **Magnexis Government Fiscal Accountability Initiative**. Built with Tauri 2, React, strict TypeScript, Rust and SQLite. The companion website is a static GitHub Pages publication, not the application.

Fiscal Watch is for public servants, oversight teams, researchers, journalists, policy staff, and civic organizations that need a calmer way to move from a public number to a defensible decision. It does not replace a budget office, an audit, a legislative score, or an agency record system. It makes the reasoning trail visible: source, definition, date, coverage, uncertainty, next verification step, and local review state.

## What it is for

Fiscal Watch helps a team answer four practical questions before it publishes or acts:

1. **What is known?** Bounded official-source adapters preserve coverage, retrieval time, source URL, query, warnings, and a provenance hash.
2. **What needs review?** Repeated patterns become a document-reconciliation queue—not an allegation, fraud flag, or savings claim.
3. **What would a scenario require?** The debt lab displays a deterministic accounting illustration with explicit inputs and limitations.
4. **What must happen next?** Fiscal Pulse and the Fiscal Strategy board make the most important research action obvious: refresh a source, inspect a record, obtain independent review, or document a decision case.

## 1.3.0 highlights

- **Fiscal Pulse:** a vibrant, guided opening workspace with research-readiness states and direct routes to the right workflow.
- **Fiscal Strategy board:** an interactive, colorful debt-to-GDP trajectory chart plus a sequenced agenda for assumption stress-testing, evidence review, and publication discipline.
- **Evidence-first controls:** official debt refresh, bounded public spending extracts, source-linked opportunities, local review notes, and a local audit trail.
- **Decision hygiene:** no fabricated savings, no passive cross-jurisdiction comparisons, no hidden cloud sync, and no silent external outreach.
- **A real product surface:** original project mark, versioned changelog, security and threat-model documents, report generation, and reproducible validation commands.

## Release 0.3.0 capabilities

Fiscal Pulse is a guided opening workspace inspired by the clarity of modern personal-finance products, adapted for public-money research. It shows only three transparent workstream states: fresh-source needed, ready to inspect, and independent review needed. The resulting “research readiness” count measures evidence coverage—not fiscal health, public-sector quality, savings, risk, or misconduct. The app now ships with an original, scalable Fiscal Watch mark at `public/fiscalwatch-mark.svg` for the desktop shell and project documentation.

## Phase 2 capabilities

FiscalWatch now includes a national fiscal command center, a native-only bounded Treasury FiscalData debt adapter, a country-profile contract, a deterministic debt-sustainability scenario engine, local opportunity records, and tamper-evident local audit entries. The U.S. profile is the only active country profile. Canada, the United Kingdom, EU members, Japan, and Australia appear only as planned profiles: no cross-country values or synthetic comparisons are shown.

The debt model uses annual nominal GDP growth, a debt interest rate, a primary balance, and an optional fiscal adjustment. It is an illustrative deterministic accounting model, not an official forecast. GDP, deficit, revenue, outlay, and interest headline cards intentionally remain unavailable until their official series have been retrieved and reconciled. BEA's API requires a registered key, and FiscalWatch does not silently query it.

The initial mission is to independently verify $100 million in potential annual government savings. **Current independently verified annual savings: $0.** Five source-checked GAO actions, historical CBO comparisons and three real bounded public-data extracts ship with the pilot. Nothing here establishes fraud, policy adoption or realized savings.

## A responsible debt-reduction workflow

Reducing debt is not a single dashboard metric. A government needs a current baseline, legally viable options, transparent assumptions, implementation capacity, distributional analysis, and independent review. Fiscal Watch supports the workflow rather than pretending to settle those questions:

| Stage | Fiscal Watch support | What it does not do |
| --- | --- | --- |
| Establish a baseline | On-demand bounded Treasury debt retrieval and source definitions | Publish a complete fiscal score without aligned official series |
| Find review targets | Local official public-data extracts and duplicate-pattern triage | Identify fraud, improper payments, or recoverable money |
| Analyze policy options | Historical CBO comparison with overlap checks | Produce a current legislative score or recommendation |
| Explore debt dynamics | User-defined, exportable deterministic scenario model | Forecast the economy or assert causation |
| Create an action record | Local registry, evidence URLs, review stages, and audit events | Submit requests, contact agencies, or claim adoption |
| Publish responsibly | Reports, methods, limits, and source links | Substitute for independent audit or legal review |

The Fiscal Strategy board labels a scenario only as **Improving**, **Stabilizing**, or **Rising pressure** based on the scenario's own change in debt-to-GDP. It is not a rating of a government, an estimate of a policy's success, or an indication that any action will reduce current debt.

## Product architecture

```text
React desktop interface
 ├── Fiscal Pulse and Fiscal Strategy board
 ├── Spending intelligence and source coverage
 ├── Debt scenario lab and JSON export
 ├── Opportunity registry and local review records
 └── Reports, methods, and policy-comparison guardrails
        │ typed IPC only
        ▼
Tauri / Rust local runtime
 ├── validated bounded public-source requests
 ├── SQLite local persistence
 ├── source/report opening allowlists
 └── structured errors and response limits
        │
        ▼
Official public sources and user-controlled local exports
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for data-flow and trust-boundary detail. The renderer cannot supply arbitrary URLs, shell commands, credentials, or file paths to the Rust process.

## Run on Windows

Download `docs/downloads/FiscalWatch-windows-x64.exe` and compare its SHA-256 with `docs/downloads/SHA256SUMS.txt`. The portable research build is unsigned, requires Microsoft Edge WebView2 and does not need a Magnexis account. No installer, auto-updater or telemetry is included.

The desktop app supports evidence review, source links, local SQLite notes, official API refresh, validated snapshot import, CSV export, review backup/restore, historical policy comparison, and bundled reports. Click **Refresh official extract** to fetch a bounded selection for the selected fiscal year. Network failure preserves cached data. Browser development preview disables native refresh and uses localStorage for notes; production is the native app.

### First five minutes

1. Open **Fiscal Pulse** and read the three research-readiness cards.
2. Refresh Treasury debt only when you need a current daily observation; confirm the source definition and date before citing it.
3. Open **Spending intelligence**, choose one bounded extract, and read its coverage warning before looking at totals.
4. Use **Debt scenarios** to make assumptions explicit; export scenario JSON with its caveat before sharing it.
5. Open an **Opportunity registry** item and record the next evidence request, source link, and review stage locally.

The recommended first outcome is a well-defined research question and provenance trail—not an unreviewed savings claim.

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

### Quality gates

| Command | Purpose |
| --- | --- |
| `npm test` | Validates monetary arithmetic, imports, scenario behavior, readiness logic, and debt-strategy boundaries. |
| `npm run typecheck` | Validates the TypeScript desktop surface. |
| `npm run build` | Produces the Vite desktop frontend. |
| `python -m unittest discover -s tests -p test_*.py` | Validates the reproducible public-data refresh utility. |
| `cargo test --manifest-path src-tauri/Cargo.toml` | Validates Rust persistence and untrusted-input safeguards. |
| `npm run desktop:build` | Builds the Windows desktop executable when Windows C++ build tools are available. |

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

GAO's bulk recommendation CSV initially returned HTTP 403, but the official 2026 direct CSV source is now documented in [GAO-METHODOLOGY.md](GAO-METHODOLOGY.md). Its bulk recommendation statuses are dated **March 2026**, not live. Individual GAO report pages are preferred for newer statuses. A successful CSV import is not yet claimed; the five-action register remains manually curated.

## Persistence and privacy

Desktop data lives in the OS local application data directory for `com.magnexis.fiscalwatch`, in `fiscalwatch.sqlite3`. It is not encrypted. No cloud sync or authentication is required. Avoid storing private tax data, allegations or constituent details in shared exports. Public Pages documents contain no personal correspondence or constituent address.

## Static GitHub Pages

The tracked `docs/` folder is a buildless static site with no analytics, form submission or remote database. Publish the `main` branch `/docs` folder using GitHub Pages settings. No custom workflow, paid hosting, Sites deployment or cloud backend is required. Run the report generator before publishing research changes; copy the verified Windows build and checksum into `docs/downloads/` when updating the binary.

## Additional GAO 2026 reference materials

The following official research reports supplement—but do not replace—the five-action register:

- [GAO-26-108932](https://www.gao.gov/products/gao-26-108932): **$132B–$251B in modeled potential future financial benefits** across the broad GAO open-recommendations portfolio. This is neither annual nor realized savings and cannot be added to other policy estimates.
- [GAO-26-108896](https://www.gao.gov/products/gao-26-108896): separate congressional open-matters inventory with selected item-level benefit estimates.
- [GAO recommendations index](https://www.gao.gov/duplication-cost-savings/duplication-cost-savings-recommendations) and [2026 CSV](https://www.gao.gov/assets/2026-05/2026%20Duplication%20and%20Cost%20Savings%20-%20Downloadable%20Spreadsheet.csv): March 2026 status snapshot, requiring report-page re-verification.

See [GAO methodology and overlap/accounting guardrails](GAO-METHODOLOGY.md). Independently verified annual savings remain **$0**. This research is independent of GAO and does not imply its endorsement.

### Optional local GAO status snapshot

The source is a **historical March 2026 snapshot**, not a live GAO-status adapter. For a controlled download with SHA-256 provenance, run:

```powershell
python scripts/gao_snapshot.py --out .local-data/gao-2026-recommendations.csv
```

The downloader validates the response format and official HTTPS origin, then stores a local CSV and companion `.csv.metadata.json` with the final URL, retrieval date, headers, row count and SHA-256. It neither changes recommendation statuses nor generates benefit claims. A successful live download is not asserted by this repository update.

## Research status and limits

- Source confirmation is not independent verification of fiscal impact.
- Historical CBO estimates require a current-law score and new start date.
- Repeated invoice patterns may be legitimate distribution lines. Candidate counts are not recoverable dollars.
- No invoice-document reconciliation or independent fiscal review has yet occurred.
- No real savings, government endorsement, adoption or submission is inferred by the software.
- Outreach is conducted separately; the local follow-up ledger never sends messages.
- Windows x64 is the only packaged target. The build is unsigned and has no updater.

See [fiscal report](docs/fiscal-impact-report.html), [architecture](ARCHITECTURE.md), [security](SECURITY.md), [threat model](THREAT-MODEL.md), [SBOM](SBOM.md), [contributing](CONTRIBUTING.md) and [changelog](CHANGELOG.md). Software is MIT licensed; upstream data and reports retain their original terms.

## Release process

1. Run the quality gates above and investigate any failure before packaging.
2. Update `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, package locks, and `CHANGELOG.md` together.
3. Rebuild reports and inspect changes to source citations and generated packages.
4. Produce the signed or unsigned Windows artifact according to the distribution policy, calculate its SHA-256, and update `docs/downloads/` only after verification.
5. Create a GitHub release only after the source, artifact, checksum, and release notes agree.

No release is automatically published, uploaded, or pushed by Fiscal Watch.

## Suggested GitHub metadata

**Description:** `Local-first fiscal intelligence for source-backed debt strategy, public-spending review, and accountable government decision-making.`

**Topics:** `fiscal-policy`, `government-data`, `public-finance`, `debt-management`, `civic-tech`, `tauri`, `react`, `rust`, `sqlite`, `local-first`, `open-data`, `accountability`
