# Security and responsible research

FiscalWatch 0.1 is an unsigned local research pilot. It is not an auditing authority or an investigative finding system.

The renderer has no generic filesystem, shell, process or arbitrary-network API. Rust only exposes validated record operations, two fixed public-data endpoints and explicit user-triggered opening of HTTPS sources or named bundled reports. Upstream redirects are rejected; requests time out after 60 seconds and cap response bodies at 20 MB. The webview CSP blocks external scripts, frames and network access.

SQLite uses parameterized queries. Text is rendered by React without HTML interpolation. Imports are schema- and size-checked; CSV values are quoted and formula-leading values neutralized. JSON snapshots and SQLite notes remain local. The database is not encrypted, and local OS users or malware may access it. Exported backups can disclose notes. Do not include private constituent information or investigative evidence in public issues or source commits.

The Pages site is static and has no tracking, user database, forms or backend. Official source links open the system browser only on user action. No secret or API key is required for research data. No donation, allegation, correspondence, spending change or deployment can be initiated by the desktop app.

Anomalies are not proof of waste or fraud. Validate source documents, request an agency explanation, record uncertainty and use appropriate official reporting channels for credible allegations. Do not publicly identify private individuals from protected data.

Report a software vulnerability through GitHub's private reporting facility if enabled. If unavailable, open a minimal public issue requesting a private contact without publishing exploit data, personal information or secrets. No penetration test or independent security audit is claimed.
