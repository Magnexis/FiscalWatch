# FiscalWatch threat model

FiscalWatch is a local-first research tool, not a system of record, government network, or certified audit environment. This document uses the NIST SP 800-30 risk-assessment framing: identify assets, threats, vulnerabilities, likelihood, and impact.

## Assets and boundaries

- Local SQLite records, review notes, source snapshots, and local registry entries.
- Bundled public research and the static GitHub Pages site.
- Explicitly invoked, fixed HTTPS requests to Connecticut, USAspending, and Treasury FiscalData.
- The trusted native Tauri/Rust boundary. The React renderer is untrusted for privileged operations.

## Primary threats and controls

| Threat | Potential impact | Controls | Remaining risk |
|---|---|---|---|
| Malicious import or malformed upstream response | Corrupt analysis or renderer failure | Zod schema validation, row-count caps, fixed native endpoints, response size/time caps | Public-source data can still be inaccurate or revised |
| Local data disclosure | Notes or exports exposed to another local user/malware | Local-only default, no telemetry, no cloud sync, no secrets in the renderer | SQLite is not encrypted; OS account security is required |
| Misleading analytical claim | Reputational or policy harm | Source links, definitions, non-overlap checks, $0 verified savings default, uncertainty labels | Human reviewers can misuse outputs |
| Webview privilege escalation | Arbitrary command/file/network access | Strict CSP, no shell command IPC, fixed URL opening, validated native commands | Dependencies and platform WebView require patching |
| Supply-chain compromise | Compromised build or release | Lockfiles, CI tests, SBOM, least-privilege CI permissions | No signed releases or independent code audit yet |
| Tampering with local history | Lost traceability | Local audit records include an event hash | Hashes are not signatures or a remote immutable ledger |

## Operational requirements

Do not store protected case material, credentials, tax information, or constituent data in the workspace. Validate a source document and obtain agency context before publicizing a suspected anomaly. Use a current official score for a proposed policy. Review release artifacts and checksum files before publication.

FiscalWatch does not claim FedRAMP authorization, FISMA compliance, a NIST certification, or government approval.
