---
id: PROC-001
title: Local multi-agent implementation workflow
status: proposed
version: 0.2.0
owner: governance
relations:
  depends_on: [STD-005, STD-002]
  decided_by: [ADR-100]
---

# PROC-001 — Local multi-agent implementation workflow

How a feature of this specification is turned into code by an orchestrating
model plus small local models, under the rules of
[STD-005](../standards/STD-005-IMPLEMENTATION-UNIT-AND-PACKET.md). The standard
fixes what must hold; this procedure fixes who does it and with which commands,
and is expected to change as tools and models change.

## Roles

| Role | Runs on | Does | Never |
|---|---|---|---|
| **Architect** | Claude Code or Codex CLI (hosted model), or a person | reads the SDD, writes the feature skeleton, locks every signature and decomposes each FR into micro-tasks with visible and holdout acceptance (STD-005 R2); runs packets that are not micro-tasks; decides escalations (R7); binds TCs | hands a stateful or multi-file unit to a local model |
| **Worker** | local model via RWANG Forge (Ollama) | one micro-task per call | reads anything outside the micro-task; retries with the same prompt |
| **Gate** | tools, not a model (L0) | Forge path guard, purity post-check, visible + holdout cases, `@trace` check, verification commands, `validate-docs` | judges style |
| **Reviewer L1** | a local model in review mode (no thinking, strict schema) | pass or escalate | rework on its own |
| **Reviewer L2** | the Architect's tier | pass or rework before merge | be skipped for core logic, authorization, money, personal data or contracts |

Model access goes through one gateway (Ollama directly, or LiteLLM in front of
it) so every dispatch is logged once with model, prompt hash and result.

## Tools

| Repository | Command | Purpose |
|---|---|---|
| this one | `node tools/readiness.mjs FEAT-042` | gates G1–G8 before anything is issued |
| this one | `node tools/packet.mjs FR-042-003 --layer service` | one FR × layer packet (Architect tier) |
| this one | `node tools/packet.mjs --micro FR-042-003 --out-dir .packets/FEAT-042` | every micro-task the SDD declares for the FR, plus the holdout files Forge reads but never shows |
| this one | `node tools/packet.mjs --queue FEAT-042 --layers test,service` | a feature's packets in R5 order |
| rwang-local-assistant | `pnpm forge smoke <model>` | onboarding gate (R9); a failing model is blacklisted |
| rwang-local-assistant | `pnpm forge pick --task-type parser` | deterministic model choice from `model_stats.jsonl` |
| rwang-local-assistant | `pnpm forge warm --model <m>` | pre-warm before a batch (cold ≈ 30× warm) |
| rwang-local-assistant | `pnpm forge run <micro.json> --model <m> [--apply]` | one worker call: staged, gated on visible + holdout, recorded |
| rwang-local-assistant | `pnpm forge run <packet.json> --model <m> [--apply]` | a full packet on a model strong enough for it (candidate only after smoke + stats) |
| rwang-local-assistant | `pnpm forge queue <queue.json> --apply` | in order; stops at the first failure |

`RWANG_WORKSPACE_DIR` points at the code repository the units target; the
specification repository is never the workspace.

## Steps

1. **Choose the feature.** `readiness.mjs` passes: approved, SDD at minimum
   with `## Interfaces`, AC and TC coverage, contracts resolve, dependencies
   approved. Foundation features first (R5).
2. **Architect: skeleton and decomposition.** From the SDD, create the
   components, exported signatures (throwing `NotImplemented`), data model and
   contract stubs in the workspace and commit them. For each FR, extract the
   pure parts into micro-task lines in `## Interfaces` (signature, ≤ 6 rules,
   visible cases, holdout cases). Everything that is not pure stays a packet.
3. **Onboard the pool.** `forge smoke` on every candidate model after any
   Ollama, driver or quantization change. Pick per task type with `forge pick`;
   a model with fewer than five dispatches for a type gets one dispatch per
   batch.
4. **Build the queue.** `packet.mjs --micro` for each FR, then `--queue` for
   the packets. Check every `prompt_tokens_estimate`; a micro-task over budget
   is split by the Architect (another interface line), never trimmed.
5. **Run.** `forge warm`, then `forge queue … --apply`. Per unit the L0 gate
   runs automatically. A micro-task that fails gets one rework on the next
   model of the pool, then rises to the Architect. A `test` packet must fail on
   the skeleton and pass after the matching `service` packet.
6. **Review.** L1 (optional, low-stakes only) may pass or escalate. L2 reviews
   everything that touches core logic, authorization, money, personal data or
   a contract, and any L1 escalation. Rework goes back as a new run, never as a
   hand edit of the worker's file.
7. **On a stop.** `design_gap` → amend the SDD (bump version), rebuild that FR's
   units, resume. `impure` → the interface line was wrong; move the unit to a
   packet. `failed` after rework → the Architect reads the run record and the
   reply and fixes the design, the requirement or the decomposition. `no_files`
   → the model ignored the output contract; check `forge smoke` before blaming
   the prompt.
8. **Close the feature.** Bind each TC in `verification.md` to the test files
   produced, citing run record ids; run `validate-docs`, `generate-views
   --check`, `impact --changed`; open the pull request with the spec commit it
   implements.

## Defaults for local models (12 GB-class GPU)

- One call, files in, files out. No tool loop for a local worker: small models
  fail more often in tool loops than in single answers.
- Prompt: plain instruction, one action, the exact signature line, at most six
  rules, acceptance as `call → expected`; no section headers, no repository
  context, no holdout case. Budget 600 tokens.
- Ollama options per call, never global: `num_ctx` 8192 for micro-tasks (16384
  for packets; never above the machine's stable envelope — spill to CPU kills
  long generations), `num_predict` ≥ 2000 (thinking tokens count),
  `temperature` 0.1, `keep_alive` 30m, `think: false` where the model honours it.
- Structured output (`format` JSON schema `{code}`) is enabled per model only
  after an A/B on the smoke suite shows it is not worse than fence parsing; the
  fence fallback chain stays. Review mode (L1) has **no** fallback: schema or
  indeterminate.
- Pre-warm before every batch. If another GPU workload must run, evict
  (`keep_alive: 0`), take a lock, and re-warm after — never run both.
- Model choice comes from `model_stats.jsonl`, never from a benchmark table;
  the smoke suite decides whether a model may enter the pool at all.

## What this procedure does not cover

Reviewing the skeleton, merging to `main`, deployment (RB-005), and any change
to a requirement's meaning (STD-003 R7). Those stay with people.
