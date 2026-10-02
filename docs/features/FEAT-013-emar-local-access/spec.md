---
version: "0.1.0"
date: "2026-10-02"
status: approved
complexity: C-2
risk: MEDIUM
scope: local-emar-service-discovery-and-launch
---

# เปิด Emar จาก Zuri-Go local

## ผลลัพธ์ที่ขออนุมัติ

ผู้ดูแลที่เปิด Zuri-Go ในเครื่องเดียวกับ Emar สามารถค้นหาและเปิด Emar จาก service launcher ในเว็บไซต์ Zuri-Go ได้ โดยทั้งสองบริการยังเริ่มและจัดการแยกกัน

## Gap analysis

| Area | Current evidence | Gap addressed here |
|---|---|---|
| Zuri-Go navigation | FEAT-008 has four approved same-origin destinations; its site menu does not list Emar. | Add a separate local-services launcher without changing those four destinations. |
| Emar runtime | Emar 0.3.0-beta.0 runs locally on port 8788 and has its own UI, SQLite state and standalone session. | Register its local deploy unit and provide a launch link from local Zuri-Go. |
| Host boundary | Both projects currently use `127.0.0.1` as their default host. Emar's standalone session cookie is host-scoped with `Path=/`. | Open Emar using `localhost`, which Emar accepts, while local Zuri-Go remains on `127.0.0.1`. The browser treats these as distinct hosts for cookies. |
| Cross-service integration | Emar's integration contract requires a trusted Identity authorizer for host integration; the starter has no JWT verifier. | No Identity, CRM, Files, Marketing, REST, or MCP integration is included in this increment. |

## Assumptions

1. The user-approved first increment is service registration plus a launcher to Emar running on the same machine; Emar is started separately.
2. The launcher is shown only when Zuri-Go is served from the exact local origin `http://127.0.0.1:4319`; hosted and other origins do not show a loopback link.
3. Emar is opened at `http://localhost:8788/`. Emar's current local host guard accepts `localhost`, and a read-only health request to that address returned HTTP 200 during preparation.
4. To use Gmail OAuth from the `localhost` UI, Emar's configured callback and the Google OAuth client's authorized redirect URI must use `http://localhost:8788/v1/integrations/gmail/callback`. This proposal does not read or change OAuth credentials.

## Sources and impact

| Level | Current document | Constraint |
|---|---|---|
| Parent | [PRD-001](../../product/PRD-001-zuri-go.md), [SRV-002](../../services/SRV-002-local/SERVICE.md) | Local Zuri-Go is a trusted operator workspace; the local site and API stay on port 4319. |
| Peer | [FEAT-008](../FEAT-008-unified-site/feature.md), [FR-008-001](../FEAT-008-unified-site/requirements/FR-008-001-site-menu.md) | Preserve the four internal same-origin destinations and their order. Emar is a separate service entry. |
| External service | Emar 0.3.0-beta.0 `README.md`, `docs/ZURI-INTEGRATION.md`, and `src/http/local-session.mjs` | Emar remains a standalone local service; it accepts `localhost`, and owns its own UI session, OAuth, storage, queue, and execution state. |

The RFC 6265 cookie model does not isolate cookies by port. Since Emar sets a `Path=/` session cookie, the launcher uses a different loopback hostname rather than opening `127.0.0.1:8788` from Zuri-Go's `127.0.0.1` origin. See [RFC 6265 §8.5](https://datatracker.ietf.org/doc/html/rfc6265#section-8.5).

## Proposed behavior

- Add Emar as `SRV-003` in `registry/services.yaml` and provide its service description under `docs/services/`.
- Add a distinct **บริการ / Services** launcher with the label **Emar (local)** to every local Zuri-Go site section, including the Metrics guide and Graph View.
- Render the launcher only when the page origin is exactly `http://127.0.0.1:4319`.
- Open the fixed destination `http://localhost:8788/` in a new tab with `rel="noopener noreferrer"`; do not append identity, tenant, campaign, or token values.
- Keep the existing four internal navigation destinations, paths and order unchanged.
- If Emar is stopped, the browser reports the local service as unavailable; the Zuri-Go page and its other links continue to work.
- The operator starts Emar separately using Emar's own run instructions. Zuri-Go does not start, proxy, health-poll, configure, or stop Emar.
- Preserve the launcher in the served local package; omit the launcher and its origin-gate code from both hosted Data App and Metrics output, including encoded scripts. This is packaging of the approved local-only scope, not an Emar deployment.

## Out of scope

- SSO, JWT/session delegation, shared permissions, or a new Identity contract.
- CRM contact/consent/suppression synchronization; Marketing content references; Files attachment access.
- Calling Emar REST or MCP endpoints from Zuri-Go.
- Gmail OAuth setup or credential/key changes. If OAuth is used from the `localhost` URL, its callback configuration must match the assumption above.
- Hosting Emar remotely, adding it to the Vercel deployment, process supervision, database migration, or production deployment.

## Acceptance and verification

| ID | Acceptance |
|---|---|
| AC-013-001-01 | At exact local origin `http://127.0.0.1:4319`, all Zuri-Go local sections show one clearly labelled Emar service launcher. |
| AC-013-001-02 | Selecting the launcher opens exactly `http://localhost:8788/` in a new tab with `noopener` and `noreferrer`; no identity or business data is sent. |
| AC-013-001-03 | At the hosted origin and any non-canonical local origin, the Emar launcher is not rendered. |
| AC-013-001-04 | The four existing internal menu links retain their order, same-origin routes, selected-state behavior, keyboard reachability, and mobile layout. |
| AC-013-001-05 | With Emar unavailable, Zuri-Go remains usable and makes no automatic request to Emar. |

Verification will cover the local-origin gate, external-link attributes, absence on the hosted build, unchanged existing navigation, and a local browser check. The release report will distinguish static/test evidence from a live Emar process, Gmail connection, or production deployment.

## Version diff

| Before | Proposed 0.1.0 |
|---|---|
| Emar is absent from the Zuri-Go service catalog and navigation. | SRV-003 is registered and a local-only launcher opens Emar through a cookie-isolated loopback hostname. |

## Approval

**Approved by the owner on 2026-10-02.** Approval covers Emar registration and the local-only launcher as specified here; it does not approve OAuth credential changes, remote hosting, or deployment.
