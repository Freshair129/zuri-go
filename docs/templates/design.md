---
id: SDD-<f>
title: <feature title> — design
status: draft
---

<!-- Template (STD-001 R1, STD-005 R2). Copy to docs/features/FEAT-<f>-<slug>/design.md.
     Required for features that persist data, call outside systems or use more than one component.
     Delete this comment. -->

# SDD-<f> — <feature title> — design

## Components
<CMP-… and how they interact.>

## Data
<Tables / entities read or owned, with the owning domain.>

## Failure modes
<What can fail and what the system does.>

## Interfaces
Per FR: the component, every exported signature as one line `name(args) → result`, the data it owns or reads, and the API / EVT it exposes or consumes. Mark a signature `pure` when it qualifies as a micro-task and then list `acceptance:` and `holdout:` examples (STD-005 R2).

- FR-<f>-<nnn> · CMP-<nnn> · `<name>(<args>) → <result>`
