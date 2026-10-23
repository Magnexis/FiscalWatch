# Software bill of materials

Release baseline: FiscalWatch 0.2.0 development line.

| Component | Version source | Purpose |
|---|---|---|
| Tauri | Cargo.lock | Desktop application runtime and IPC |
| Rust | Cargo.lock / toolchain | Native data and persistence layer |
| rusqlite (bundled SQLite) | Cargo.lock | Local persistence |
| reqwest with rustls | Cargo.lock | Fixed, bounded official data retrieval |
| React | package-lock.json | Renderer UI |
| TypeScript | package-lock.json | Typed renderer build |
| Vite | package-lock.json | Local frontend build |
| Zod | package-lock.json | Input and data validation |

package-lock.json and src-tauri/Cargo.lock are the authoritative transitive dependency inventories. CI uses npm ci and Cargo's lockfile. No software dependency is bundled into the static site beyond generated HTML/CSS.

The project has no automated vulnerability scanner yet. Before a public signed release, run a current dependency audit, review advisories for the locked versions, produce SPDX or CycloneDX output from the release environment, and archive it with the build checksum.
