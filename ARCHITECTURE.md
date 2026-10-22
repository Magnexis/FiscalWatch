# Architecture

The product is a desktop research workspace. The static Pages companion publishes reports, evidence metadata and downloads.

- `src/main.tsx`: task navigation, evidence inspector, workbench, policy comparison and local follow-up UI.
- `src/model.ts`: Zod trust boundaries, cent-exact arithmetic, repeat/conflict handling, concentration and invoice candidate rules.
- `src/evidence.ts`: five curated GAO actions and four historical CBO alternatives, with sources and limitations.
- `src/storage.ts`: typed desktop IPC, review backup and browser development fallback.
- `src/connectors.ts`: official response normalization and boundary validation.
- `src-tauri/src/main.rs`: SQLite migration, parameterized persistence, bounded official HTTP requests and explicitly invoked source/report opening. No renderer shell or arbitrary filesystem access.
- `scripts/refresh_data.py`: reproducible public-data acquisition with byte-level response hashes.
- `scripts/render-reports.ts`: shared evidence and analysis to bundled HTML reports and static Pages documents.
- `public/data`: validated, bounded official extracts bundled for offline use.
- `docs`: static GitHub Pages site. No React app or research database is hosted here.

## Data flow

Bundled snapshots are validated before display. Native refresh uses a fixed upstream endpoint selected by an enum-like source value; fiscal year and award kind are validated in Rust. Responses are size/time bounded and normalized into the shared schema. The renderer validates metadata, row types and money, runs conflict checks, and persists the snapshot through SQLite. A failure does not replace the prior extract.

The SQLite v1 schema stores namespaced JSON records in a composite primary key table and uses `user_version=1`. Each upsert is atomic. Review restore validates the entire input before writing; writes are per record, so an OS failure during a multi-record restore can partially apply. No background network refresh or automatic outreach exists.

## Fiscal model

Only like metrics within one extract are aggregated using integer cents. Exact source-key repeats are excluded and conflicting versions stop analysis. Candidate invoices require known vendor ID, invoice, agency, date and equal positive amount across different distribution keys. Redacted identities are never combined into one vendor. This is a triage heuristic with no fraud classification.

GAO evidence status, independent fiscal validation, adoption and realized savings are separate concepts. The app does not permit entering invented savings totals. The CBO basket blocks overlapping alternatives but remains arithmetic on historical scores, not an integrated fiscal model.

## Expansion boundaries

New jurisdictions need explicit source adapters, currency/year definitions, privacy handling and validation. Future large-data ingestion should use durable normalized tables and paging/checkpoints; this version intentionally caps native CT refresh at 1,000 rows and federal refresh at 100 awards per type. Independent review, invoice reconciliation and a current legislative score remain operational work.
