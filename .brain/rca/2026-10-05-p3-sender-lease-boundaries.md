---
status: active
superseded_by: null
---

# P3 sender lease boundaries

Symptom: independent review of the unmerged sender candidate found that a delayed Claim result could start HTTP after expiry, and finalizers could wait indefinitely on a database lock.

Evidence: the initial `sendMarketingDelivery` proceeded directly from Claim commit to transport; `deliverySql` set no lock or statement deadline. Review was performed before native sender acceptance or any real schema 012 application.

Root cause: the first implementation enforced expiry only in the SQL completion fence. That prevents a stale ACK but cannot prevent a stale network send or bound time spent waiting for a lock.

Detection gap: previous transport tests cover HTTP deadlines, while ledger tests cover post-lock SQL clocks; neither exercised the new orchestration boundary.

Prevention: fail closed immediately before HTTP using the returned lease deadline and a conservative monotonic Claim budget; bound sender SQL locks/statements to five seconds and Complete to its remaining lease. PostgreSQL still rechecks its own clock after locks. Add delayed-claim and actual held-lock tests. No automatic HTTP retry follows a completion failure.

Follow-up evidence: review found `marketing_delivery_finish` sampled time after the delivery lock but before its final attempt-row lock. A wait on that last row could validate a non-ACK result against stale time. Capture `clock_timestamp()` after all locks, and test a held attempt row crossing an isolated shortened lease. Also verify the actual first-claim 24-hour boundary and valid ACK on attempt four.
