---
id: DOM-IAM
title: Identity & access
status: proposed
---

# DOM-IAM — Identity & access

Who may read, who may write, and who did it: public Guest reads, Member sign-in for writes, and an audit actor derived on the server.

Classification ([registry/domains.yaml](../../../registry/domains.yaml)): subdomain `generic` · role `foundation`.

## Language
- Guest
- Member
- PID
- Identity code (รหัสระบุตัวตน)
- Credential version
- Session
- Write intent
- Trusted local operator

## Owned data
- `members` (including the immutable `pid`)
- `member_credentials`
- `team_login_limits` (persistent sign-in rate-limit counters)
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- Production opens in Guest mode, read-only; API authorization enforces writes independently of UI state ([AGENTS.md](../../../AGENTS.md)).
- Sign-in is one masked field: exactly one matching credential across the Business (disabled candidates count for ambiguity) must belong to an active, enabled Member; a caller-supplied PID or member ID never selects the actor ([FEAT-007 spec](../../features/FEAT-007-single-code-login/spec.md)).
- PID is the stable public identifier; UUID stays the primary/foreign key and canonical actor identity ([FEAT-006 spec](../../features/FEAT-006-member-identity/spec.md)).
- Sessions are signed and versioned; the credential is rechecked in the write transaction; origin checks and persistent rate limits apply; there is no shared-password fallback ([FEAT-006 spec](../../features/FEAT-006-member-identity/spec.md)).
- Local access is a trusted operator on `127.0.0.1:4319`, never an authenticated Member session ([SRV-002](../../services/SRV-002-local/SERVICE.md)).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-005](../../features/FEAT-005-guest-access/feature.md) | Guest read-only access and task evidence | live |
| [FEAT-006](../../features/FEAT-006-member-identity/feature.md) | Member identity (PID and individual sign-in) | live |
| [FEAT-007](../../features/FEAT-007-single-code-login/feature.md) | Single-code login | live |

**Participating cross-domain features** — none.

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
