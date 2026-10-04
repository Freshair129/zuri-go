---
title: RCA — native backup environment connection parameters
status: approved
superseded_by: null
date: 2026-10-05
risk: LOW
---

# Symptom

Independent review of documentation candidate `483cc4f` found that the new native backup example may select the default host/port and a literal URI database name. The example was syntax-checked but never executed; the completed restore/migration is unaffected.

# Evidence

RB-001 sets `PGDATABASE: config.adminUrl` without an explicit dbname command argument. [PostgreSQL 18 connection documentation](https://www.postgresql.org/docs/18/libpq-connect.html) specifies that URI expansion happens for explicit dbname parameters before unset parameters are filled from environment defaults. The Local server uses non-default port 55412.

# Root cause

The example treats the environment database-name fallback as an expanded connection URI. It therefore omits explicit Local host, port and login parameters and permits inherited libpq settings to influence the command.

# Why the issue escaped detection

Node syntax validation cannot verify libpq connection-parameter semantics. No native dump or connection test had been executed for this documentation example.

# Proposed prevention

Decode the validated Local URI into separate PGHOST, PGPORT, PGDATABASE, PGUSER and PGPASSWORD values in the child environment after clearing inherited PG settings. Keep credentials out of arguments/output. Check syntax plus a read-only libpq connection to the expected database/port; do not claim a new full backup or restore drill from that connection check.
