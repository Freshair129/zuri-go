# Extraction checkpoint versus authored revisions
Symptom: the relocation verifier would reject the approved TeamAccess revision.
Evidence: verify_extraction.py compares every apps/web file to the 0.4.1 source-manifest, while apps/web/protected-runtime.json explicitly allows src/content/, src/theme.css and src/data.json to change.
Root Cause: a one-time exact-copy acceptance check was retained as a permanent authored-content freeze.
Why escaped: the extraction release intentionally changed no authored content, so both contracts matched then.
Prevention: honor the existing editablePaths for historical copy comparisons, keep immutable/runtime/assets/private handover checks, and continue the independent protected-runtime build verifier. Do not modify integrity manifests.
