# Initial team login presentation — 2026-09-30

Complexity C-2, LOW display fix within the approved team-login implementation.

## Symptom
A fresh production visitor sees a session-expired message on first login and the old Campaign Mission Control title in the protected shell.

## Evidence
Production browser DOM after anonymous `/session` returned AUTH_REQUIRED shows the expiry alert and old shell title. `api.mjs` dispatches the expiry event for every AUTH_REQUIRED response. The previous title migration effect is inside MeetingWorkspace, which mounts only after authentication.

## Root cause
The new login gate treats the expected anonymous session probe as expiry, and delays the existing product-title migration until after login.

## Why it escaped detection
API tests correctly expected anonymous 401 but did not validate the first-visit presentation before the workspace mounted.

## Prevention
Exclude the initial session probe from expiry notifications. Run the already-approved title migration in the outer login gate using the public shell API. Verify first-visit login and authenticated reload in the browser.
