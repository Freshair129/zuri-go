# Zuri-Go 0.4.1 — standalone project extraction

Date: 2026-09-30. Approved contract: [ZGO-STRUCT-001](001-project-extraction.md). Source relocation implemented; automated build, API, database and packaging checks pass. Browser visual verification was blocked by the browser tool's URL policy and was not bypassed.

## Result
- Active working project: **D:/workspace/zuri-go**.
- Source checkpoint: D:/zuri-brand-kit, preserved with relocation notices. No original source, backup or database volume deleted.
- 680 mapped file copies recorded in [source-manifest.json](source-manifest.json), with hashes and provenance. Generated outputs are rebuilt, not treated as authoring source. Temporary QA sessions/cookies, obsolete shared passwords, dependencies and unrelated brand projects were excluded from active source.
- Source layout now separates apps/web, apps/api, apps/metrics, scripts, tests, docs, brand/assets, generated build and private .local. No additional monorepo framework or new service was introduced.
- local Node process was switched after confirming the listener's Business identity. New PID at verification: 48472; command line explicitly runs `D:/workspace/zuri-go/apps/api/server.mjs` on 127.0.0.1:4319.

## Tests and build
- `npm run setup`: locked API dependencies installed, 14 packages, zero reported npm audit vulnerabilities at install time.
- `npm run build`: Metrics generator/static check, protected Data App build, unified-site package and Vercel allowlist package passed.
- `npm test`: **91/91 Node tests** (28 backend + 28 meeting/FUNG contract + 35 campaign), **5/5 Python packaging tests**, Metrics static audit and extraction checks passed.
- Dashboard HTML SHA-256 remains `afe09e664a0b039665ae83d28ed8803d7eaafa063ea585b5842bdd71d7fce777`; protected runtime remains `9e3ede84b28aded3c7379b6e6a5611f0d95b9977eb0f781e279ceefabfcbd27e`; stable app ID remains dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1.
- Both built Dashboard and packaged Metrics HTML were compared against the prior build and are byte-identical. The guide remains 18 pages, 38 metric cards / 40 graph terms, with both mascots on 18 pages, no missing assets/anchors, 2D/3D, three backgrounds and full-rotation controls intact.
- **297 source/asset/private-handover files** in the invariant copy set match their source hashes. **46 deploy files** passed actual private-value exclusion checks. Runtime import of the packaged API passed after installing its own locked dependencies; it does not need the source service's node_modules.
- Read-only HTTP tests on the new listener pass: local bootstrap, static app, guide/graph, and rejection of private paths and cross-origin access. Browser tab verification returned a policy rejection before navigation; no screenshots or visual interaction checks are claimed for this extraction. Previous release screenshots remain historical evidence.
- An initial Metrics static-check failure was traced to same-origin root navigation being interpreted as a Windows filesystem asset. The checker now recognizes only the two approved root routes, while asset checks remain. [RCA](../../.brain/rca/project-extraction-metrics-route-check.md).

## Database preservation
- New private full local dump created at `.local/backups/zuri-go-2026-09-30T15-53-30-612Z.sql` before local cutover. Existing backups and four credential handovers were copied.
- Compared private before/after row digests across all Business-scoped application tables in both local and Neon. **All rows were unchanged**, including credential hashes/versions, Member IDs/PIDs, RACI, task history and attachment payloads. Tests created isolated QA Businesses, not user Business records.
- [database-preservation.json](verification/database-preservation.json) reports counts only. Both user workspaces retain 4 Members, 1 campaign and 11 weekly entries. Local has 11 task rows. Cloud has 12 task rows because its pre-existing archived QA task remains, leaving 11 visible user tasks; pre-existing archived QA content/history/files were not removed or reactivated.
- Existing local Docker volume/container and Neon database remain. No schema migration, reimport, credential rotation or synchronization was performed.

## Deployment boundary
- Production remains the previously released 0.4.0; **no new production deployment was performed** for this extraction.
- Generated Vercel package version is 0.4.1, ready for the existing project. Durable project binding is `scripts/deploy/project.json`; the packager copies it into build/vercel and refuses a conflicting existing binding. Project ID: prj_8f3zf1qaZnRcAvWabOv1PWAPIABG.
- Production environment variables and access settings were not modified. Root `npm run deploy` is the explicit deploy command, not part of build/test/start.

## Version diff: 0.4.0 → 0.4.1
| Before | After |
|---|---|
| Brand-kit projects/output directories | Dedicated D:/workspace/zuri-go working root |
| Imports/build scripts tied to old layout | Module/root-relative paths in apps/scripts |
| Service-local .local folder | Root private .local with unchanged configs/handovers |
| Scattered start/build/test commands | Root npm commands and operations runbook |
| Vercel binding only in generated output | Durable non-secret binding restored by packager |
| Existing auth, DB and product behavior | Byte-identical UI output and passing domain tests |

[Relocation source diff](version-diff.patch) · [Changed source mapping](changed-files.json) · [Extraction checks](verification/extraction.json)

The new request for a single “รหัสระบุตัวตน” input is a separate proposed [0.4.2 authentication amendment](../architecture/identity-code-login-spec.md), not implemented or deployed as part of this path-only extraction.
