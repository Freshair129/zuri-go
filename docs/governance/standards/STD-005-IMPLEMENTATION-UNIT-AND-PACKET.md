---
id: STD-005
title: Implementation Unit & Packet Standard
status: approved
version: 0.2.0
owner: governance
relations:
  depends_on: [STD-001, STD-002, STD-003]
  decided_by: [ADR-100]
---

# STD-005 — Implementation Unit & Packet

**Principle: code is produced in units small enough for a narrow worker to finish
alone, only after the interfaces between units are fixed, and only a
deterministic gate says whether a unit is done.** A worker may be a person, a
hosted model or a small local model; the rules are the same. What makes units
assemble is not the worker but the lock on the design and the checks that prove
each unit.

The workflow that applies these rules (roles, tools, commands) is
[PROC-001](../procedures/PROC-001-local-multi-agent-implementation.md) and may
change without changing this standard. The evidence behind the rules for local
models is the owner's earlier dispatch programme (a 74-dispatch benchmark on a
12 GB GPU and its RCAs); its conclusions are carried here as rules, not repeated.

## R1 — Units

| Unit | Size | Produced by | Proven by |
|---|---|---|---|
| **Skeleton** | one per feature: components (CMP), exported signatures, data model, ports, contract adapters as stubs | Architect, from the SDD | `validate-docs`; every FR maps to one component |
| **Packet** | one FR × one layer (`schema` · `service` · `contract` · `ui` · `test`) | one worker at the Architect's tier, one call | the packet's verification commands |
| **Micro-task** | one pure function in one file, ≤ 150 lines, no I/O, no state, no import; prompt ≤ ~600 tokens; acceptance as computable input → expected | the **only** unit a local model receives | visible + holdout acceptance run by the gate |
| **AC test** | one automated test per acceptance criterion, named by the AC id | a worker | fails on the skeleton, passes after the behaviour |
| **TC** | the feature-level test bound in `verification.md` | Architect, from AC tests | `tests-for` reports it |

Nothing smaller than a micro-task is planned or tracked. Nothing larger than a
feature is given to a single worker. A packet that is not a micro-task is not
eligible for a local model (R8).

## R2 — Interface lock

Before any packet or micro-task of a feature is issued, its SDD carries a
`## Interfaces` section that names, per FR: the component (CMP), every exported
signature as one line ``name(args) → result``, the data it owns or reads, and
the API/EVT contract it exposes or consumes. A signature line marks itself
`pure` when it qualifies as a micro-task, and then carries its acceptance
examples in two lists, `acceptance:` (visible, may appear in a prompt) and
`holdout:` (never shown to any worker). A worker that would need to change a
signature stops and reports `DESIGN_GAP`; the SDD is amended first. An SDD below
the STD-001 minimum cannot issue packets.

## R3 — Packet and micro-task contents

Both are JSON documents produced by `tools/packet.mjs`, and are the only thing
the worker sees. Neither carries a secret, a hostname, personal data, a holdout
case, or a file outside the allowed paths.

A **packet** carries, verbatim from the canonical files: the requirement
(statement, every AC, delivery), the feature (id, title, owner, runtime), the
SDD excerpt relevant to the FR, every API/EVT the FR is `specified_by` or the
feature `depends_on`, every BR/SEC/ADR it is `derived_from` or `decided_by`,
the guard rails (ADR-100, ARCH-001 layering, STD-002 R6 `@trace`, no secrets,
no refactor), the TCs, the allowed paths and the current files there, the
output contract, the verification commands and a token estimate.

A **micro-task** carries only: target path, the one signature line, at most six
rules as bullets (including how invalid input is handled), the visible
acceptance cases, at most three past-mistake lines (R6), the output contract
and a token estimate. The prompt is plain instruction — one action, no section
headers, no repository context — and its total stays under the worker's
budget (default 600 tokens).

## R4 — Definition of done

For a **packet**: every returned file lies under an allowed path (a path that
escapes is refused, never moved); every source file starts with
`@trace implements <FR>` and every test with `@trace verifies <AC>`; the
verification commands exit 0; `validate-docs` still reports 0/0; a run record
exists (R6).

For a **micro-task**: the gate is deterministic and nothing else — the returned
file parses, the visible cases pass, the holdout cases pass, and the file passes
the purity post-check (no import, no I/O, no global state). An empty, garbage or
special-token answer is a fail. A local pass is never a merge: every micro-task
that passes the gate still goes through the review tiers of R10.

Style, naming beyond the SDD, and refactoring outside the allowed paths are not
done-criteria for any unit.

## R5 — Order and exclusivity

- Foundation domains first (DOM-PRJ scope chain, DOM-IAM viewer gate), then
  features in `depends_on` order (`tools/impact.mjs` gives the dependents).
- Within a feature: FRs ascending; per FR the `test` layer before `service`,
  then `contract`, then `ui`; `schema` packets precede the first `service`
  packet that needs them; micro-tasks of an FR precede its `service` packet.
- Two packets never write the same component at the same time. A queue stops
  at the first failed packet; continuing is an explicit choice.

## R6 — Evidence and memory

Every run leaves a record: unit id, FR, layer or micro-task name, worker
(model tag or person), prompt hash, files returned and refused, gate results
(visible and holdout exits separately), timestamps, token counts, warm/cold.
Records are append-only and written by one process. Two derived files are kept
next to them: `model_stats.jsonl` (one line per local dispatch: model, task
type, gate pass/fail, latency) and `ledger.jsonl` (lessons: model, task type,
severity, the mistake and its fix, `blacklist` when a model must not be used
again). Lessons are injected into later prompts as past-mistake lines; a
blacklist lesson is always injected regardless of similarity. Records live where
the runner keeps its data, never inside the specification repository, and are
cited from `verification.md` when a TC is bound to the test they produced.

## R7 — Escalation

A worker escalates, and a unit is never retried blindly, when: the SDD does not
give a needed signature (`DESIGN_GAP`); an AC cannot be turned into a test as
written (ambiguous AC → the FR is revised, STD-003 R7); the gate fails. A
micro-task gets **one** rework at most, and that rework goes to the next model
in the pool, never to the same model with the same prompt; after that the
micro-task rises to the Architect's tier. Escalation changes the design, the
requirement, the model or the decomposition — never the packet by hand.

## R8 — Eligibility for a local model

A unit goes to a local model only when every check holds; one failure sends it
to the Architect's tier with the failed check named.

| # | Check | Judged by |
|---|---|---|
| E1 | one function, signature stated in one line | the SDD interface line |
| E2 | pure: no I/O, no state, no import — declared in the SDD **and** post-checked on the returned code | the gate |
| E3 | one file, no other file touched | the packet |
| E4 | acceptance is computable input → expected, at least two visible cases (one invalid/edge) and at least one holdout case | the SDD interface line |
| E5 | the whole prompt fits the budget (default 600 tokens) | `packet.mjs` counts |
| E6 | not security-sensitive, not money or pricing, not an external API contract — every FR owned by DOM-IAM (identity and access) or DOM-COM (orders, payments, pricing), every FR derived from a SEC-, and any FR whose title names credentials, tokens, payments or webhooks | the FR's domain and BR/SEC links (`packet.mjs`) |

Approved micro-task types: pure calculators, parsers and formatters, validators
and predicates, code/identifier generators, DSP or date helpers. Anything
stateful, multi-file, or needing the PRD, the SDD as a whole or a repository
search is a packet, not a micro-task.

## R9 — Model onboarding and selection

A local model joins the pool only after a fixed smoke suite (three micro-tasks
with known answers, unchanged over time) passes: no special-token leak, a
plausible token count, extractable code, all assertions green, cold and warm
latency recorded. A failing model is blacklisted in `ledger.jsonl` with the
reason. Selection among pool models is deterministic and statistical: a model
is demoted for a task type when its pass rate there is below 0.6 over at least
five dispatches; among the rest the highest `pass_rate − 0.1 × (median warm
latency / 10 s)` wins; a model with fewer than five dispatches for a type is a
candidate and receives at most one such dispatch per batch; an empty pool sends
the unit up a tier. Re-run the smoke suite after any runtime or quantization
change.

## R10 — Review tiers

Verification of a unit is one gate with three stages; a later stage never sees
what an earlier one rejected.

| Stage | Reviewer | May decide | Cost |
|---|---|---|---|
| L0 | deterministic: parse, purity post-check, tests, `validate-docs`, `@trace` lint | pass · rework | none |
| L1 | a local model configured for review (no thinking, strict JSON schema, no fallback parsing) | pass · escalate — never rework on its own | none |
| L2 | the Architect's tier (a person or a hosted model) | pass · rework | paid |

L2 is mandatory before merge for any unit touching core logic, authorization,
money, personal data or a contract; low-stakes units that pass L0 and L1 may
skip L2 only under a recorded policy, never silently. A reviewer is always a
higher tier than the worker; a model never reviews its own output.
