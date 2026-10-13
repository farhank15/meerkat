# SPEC.md — Meerkat suite contract

This is the contract the Meerkat test suite verifies. It is also the oracle for the
audit trail: every score Meerkat reports can be traced back to a line in this file.

- **Scenario IDs** use the format `SV-<FAMILY>-<NN>` (e.g. `SV-TSI-01`).
- **Every scenario asserts at least one exact value** — a number, an exact string, or a
  row count. A scenario without an exact value is not a valid scenario.
- The suite is generated from this file in the TestSprite 3.0 portal, then runs against
  the live deployment on every pull request.

This file is the **core suite**: 30 scenarios. It is deliberately small enough to run on
every PR within a free-tier credit budget. Scenarios are added incrementally, one PR at a
time, and this file grows with them.

---

## Scoring

```
coverage   = covered_ids / total_ids
stability  = 1 − conflicted/tested      (fewer than 2 runs on the same SHA → 1.0, labelled "estimated")
pass_rate  = passed / total
TSI        = round(100 × (0.50×coverage + 0.30×stability + 0.20×pass_rate))
```

`TSI` is deterministic: the same inputs must produce byte-identical output from both the
CLI and the dashboard.

---

## Core suite (30)

### Smoke — 2

| ID | Asserts | Exact value |
|---|---|---|
| `SV-SMK-01` | `GET /` renders the demo scorecard without login | TSI `93` shown; a "View first run" control is present |
| `SV-SMK-02` | `GET /api/health` | `200`, body `{"status":"ok"}` |

### Action configuration — 2

| ID | Asserts | Exact value |
|---|---|---|
| `SV-CFG-01` | Action defaults with no `spec-path` / `junit-path` set | reads `SPEC.md` and `testsprite-junit.xml`; run recorded `status=complete` |
| `SV-CFG-06` | Draft PR still gets a check and a comment | check present, comment present |

### JUnit ingest — 3

| ID | Asserts | Exact value |
|---|---|---|
| `SV-ING-01` | Counts from the 67-testcase fixture | `total=67, passed=64, failed=3, skipped=0` |
| `SV-ING-02` | Skipped testcases count toward the total | 10 testcases, 2 `<skipped/>`, 6 pass, 2 fail → `pass_rate = 6/10 = 0.60` (not `6/8`) |
| `SV-ING-04` | Malformed JUnit XML | run `status=parse-error`; banner shown; app does not crash |

### TSI formula — 4

| ID | Asserts | Exact value |
|---|---|---|
| `SV-TSI-01` | Primary fixture | coverage `60/67`, stability `66/67`, pass `64/67` → `round(93.43) = 93` |
| `SV-TSI-04` | Rounding is half-up, not truncation | `95.4999 → 95`; `95.5 → 96` |
| `SV-TSI-06` | Determinism | same input twice → byte-identical JSON (no timestamp inside the value) |
| `SV-TSI-07` | Delta against the previous run | previous `96`, current `93` → `delta = -3` |

### Coverage traceability — 3

| ID | Asserts | Exact value |
|---|---|---|
| `SV-COV-01` | Partial match | SPEC `67` IDs, JUnit has `60` → `coverage = 60/67 = 0.895522` |
| `SV-COV-04` | ID matching is case-sensitive | test named `sv-smk-01` does **not** match; recorded as an orphan test |
| `SV-COV-09` | Coverage table on the run detail page | 67 rows (ID · status · test name); `SV-SMK-01` shows `covered` |

### Ratchet — 3

| ID | Asserts | Exact value |
|---|---|---|
| `SV-RAT-01` | A drop blocks the merge | baseline `main` `96`, PR `93` → check red, text `TSI dropped 96 → 93 (ratchet)` |
| `SV-RAT-03` | A rise updates the baseline | baseline `96`, PR `98`, merged → baseline on `main` becomes `98` |
| `SV-RAT-06` | The two checks are separate | PR Checks tab shows both `testsprite-dev` and `SuiteVitals Ratchet` |

### PR comment — 2

| ID | Asserts | Exact value |
|---|---|---|
| `SV-PRM-01` | Comment content | line `TSI 93 (Δ −3 vs main 96)` + 3 metric lines + run-detail link |
| `SV-PRM-02` | Edit in place | second push updates the same comment (marker `<!-- suitevitals -->`); total comments stays `1` |

### Verdict trust — 2

| ID | Asserts | Exact value |
|---|---|---|
| `SV-VDT-01` | A refusal is not a failure | run `status=incomplete`; test labelled `refused (not a failure)`; not counted in `failed`; TSI `n/a` |
| `SV-VDT-02` | An incomplete rerun is refused | 3 requested, 2 finished, 1 refused → label `incomplete rerun refused`, check `neutral`, text `2/3 completed, 1 refused` |

### Spec drift — 2

| ID | Asserts | Exact value |
|---|---|---|
| `SV-DRF-01` | Drift is distinguished from a bug | `SV-COV-07` fails while its ID was removed from SPEC since the previous run → classified `spec-drift`, not `regression` |
| `SV-DRF-03` | A spec-only change is neutral | PR touches only SPEC → ratchet `neutral`, label `spec-change only`, baseline unchanged |

### Audit trail — 3

| ID | Asserts | Exact value |
|---|---|---|
| `SV-AUD-01` | Trace the score to its JUnit source | clicking TSI `93` lists `testsprite-junit.xml` and the exact testcase rows behind each metric, including the `3` failing testcases |
| `SV-AUD-02` | Trace a gap to its SPEC line | clicking gap `SV-RAT-05` shows `<spec-path>:<line>` where that line genuinely contains `SV-RAT-05` — for the seeded demo run the path is `fixtures/SPEC.md` |
| `SV-AUD-03` | Provenance is pinned to a commit | panel shows the commit `sha` and `run_id`; the link resolves to the public repo at that `sha` |

### Auto-remediation loop — 4

Fixture: PR with run TSI `90` (coverage `57/67`, stability `66/67`, pass `61/67` → `round(90.30) = 90`),
baseline `main` `93`; `SV-TSI-04` fails; bundle `fixtures/bundle/step-fail/` reports
`failed at step 3/5: click "Verify"`, `expected "95", received "96"`, `snapshotId snp_A1`.

| ID | Asserts | Exact value |
|---|---|---|
| `SV-FIX-01` | A regression is fixed and goes green | action `dispatch`; agent commits `fix(meerkat): correct rounding rule`; rerun TSI `93`; check green; comment line `loop: regression → fix proposed → green` |
| `SV-FIX-02` | A refusal is never auto-fixed | action `none`, label `refused (not a failure)`; no commit, no dispatch; comment line `loop: refused → no action` |
| `SV-FIX-04` | Drift updates the test, not the code | action `test-update-needed`; application code untouched; comment line `loop: spec-drift → test update needed` |
| `SV-FIX-06` | A failed attempt escalates | after 1 attempt the rerun is still red → label `escalated to human`; never retries more than once |

---

## Fixtures

| Item | Value |
|---|---|
| Demo account | `demo@suitevitals.dev` / `demo-password-1` |
| JUnit | `fixtures/junit/67t.xml` (64 pass / 3 fail / 0 skip) |
| Fixture spec | `fixtures/SPEC.md` — 67 IDs, separate from this file; used for the arithmetic fixture |
| Failure bundle | `fixtures/bundle/step-fail/` — 5 steps, step 3 fails, `snapshotId snp_A1` |
| Verdicts | `fixtures/verdicts.md` — refused / incomplete / drift / regression / no-bundle |
| Seeded demo data | 2 projects (10 + 3 runs; TSI 88 → 93, one flake, one gap, one regression→fix→green PR) |
| Reset | `POST /api/test/reset` (preview only, secret header) |

---

## How scenarios are kept honest

1. The description is the contract. If the UI changes, the scenario changes in the same PR.
2. Every scenario asserts at least one exact value.
3. A real bug the suite catches gets a scenario that catches it again, recorded in the
   README proof-of-loop table.
4. **No shallow assertions.** UI scenarios (`SMK`, `PRM`, `AUD`, `FIX`) must assert exact
   fixture values — a number, an exact line, or a row count. Words like "renders", "is
   present", or "changes accordingly" without a value are not valid scenarios.
