---
status: active
superseded_by: null
---

# Vercel deploy wrapper selects the project alias from CLI JSON output

## Symptom

The 2026-10-06 staged deployment was READY, but `npm run deploy` printed the project alias as its staged URL instead of the unique deployment URL.

## Evidence

Source `scripts/run.mjs` at Go main `197fe6c` implements `deploymentUrl` as a broad HTTPS match followed by `.pop()`. Private `.local/deploy-20261006/deploy.log` from CLI 61.1.0 contains deployment ID `dpl_EGUg7uHqGE1Pf3brpcipgzR6X4mc`, unique `deployment.url` `https://zuri-metrics-3hszomigs-pornpons-projects.vercel.app` and a later `productionUrl`/instructions project alias. The wrapper reports `https://zuri-metrics-map-pornpons-projects.vercel.app`. Independent `vercel inspect` verified the unique URL/ID and confirmed the public domain still pointed to the old deployment before promotion.

## Root cause

The parser assumes the last HTTPS URL in CLI stdout identifies the deployment. The CLI's structured output and next-step instructions contain later alias URLs, violating that assumption.

## Why the issue escaped detection

The existing operator-guard fixture covers plaintext with one staged URL. It does not cover JSON plus multiple URLs or require the extracted URL to match the inspected deployment identity.

## Proposed prevention

A future approved code change should prefer validated structured `deployment.url`, retain bounded legacy output compatibility only where needed, and test multi-URL output plus identity matching. This deployment made no parser change: the operator verified the unique URL and READY ID using inspect, ran stage checks there, then promoted that exact URL and verified the public alias. The code fix is out of scope for the deployment request.
