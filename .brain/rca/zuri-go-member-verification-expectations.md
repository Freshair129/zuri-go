# Member identity verification expectations — 2026-09-30

## Symptom
The full database suite initially rejected the expected cross-Business write failure code. The first staged identity check passed four real logins, actor writes, archives and negative login checks, then failed the final workspace equality check.

## Evidence
- The new PID trigger performs a Business-scoped counter UPDATE before INSERT RLS. Foreign Business rows are hidden, producing SQLSTATE 23514 with exact message `Business scope required`, rather than the prior 42501 from table RLS. The insert still fails.
- The staged diff contained only Meeting Task Manager `revision: 12 -> 20`. Each of four isolated content creates and archives correctly increments the shared Business domain revision. Task/member/assignment/history data was unchanged.

## Root cause
Verification assumptions did not account for the earlier PID scope guard or the existing cross-domain concurrency counter. Neither result demonstrates an authorization bypass or a data change to user tasks.

## Why it escaped detection
The original checks were written for the pre-PID trigger and assumed isolated content writes could not affect the workspace revision projection.

## Prevention / correction
Accept 42501 or only the exact new scope-guard 23514/message pair and additionally query the target Business to prove no blocked row exists. Compare user domain data excluding the expected aggregate revision, using a digest to avoid dumping full user state on assertion failure. Preserve identity/actor/negative-auth assertions. Rerun both checks before rollout.
