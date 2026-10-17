# Meerkat — Product Requirements Document

> Product specification for TestSprite's test-generation agent. This document
> describes **what the product is and does**, with exact acceptance values so the
> agent knows what counts as a pass. The full 33-scenario test contract lives in
> [`SPEC.md`](SPEC.md) (uploaded alongside this file).

## 1. Product Overview

- **Product Name:** Meerkat
- **Tagline:** *Your suite is green. But is it meaningful?*
- **Description:** Meerkat reads TestSprite's verdicts and scores how strong a
  test suite really is, then closes the loop only when that verdict can be
  trusted. It is built for maintainers and reviewers of AI-coded repositories who
  already have a green TestSprite check and need to know whether that green means
  anything — before they merge.

Meerkats stand watch over the colony; Meerkat stands watch over every pull
request and asks the question green checkmarks never ask: *did this test actually
assert something, and can I trust the verdict?*

## 2. Goals & Objectives

- Score **suite strength**, not just pass/fail: coverage, stability, assertion
  depth, and pass rate fold into one number — the **Test Strength Index (TSI)**.
- **Catch the vacuous pass** — a test that passes without asserting anything is
  labelled `vacuous` and excluded from the score.
- Add a **trust layer** to the verdict: a refused run is not a failure; an
  incomplete rerun never passes the gate; a diff against a verdict-less run is
  refused.
- **Tell spec-drift apart from bugs** — a failure caused by a changed spec is
  labelled `spec-drift`, not `regression`.
- **Trace every number** — any score can be drilled down to the test rows, the
  `SPEC.md` line, and the commit SHA behind it.

## 3. Target Users

- **Maintainer** (repo owner): installs the integration, watches TSI per PR,
  chases coverage gaps, lets the loop fix regressions.
- **PR Reviewer:** reads the bot comment (TSI + delta + gaps + verdict label) and
  decides whether to merge.
- **Visitor / Judge:** opens the public scorecard and the Loop page (dogfooding —
  Meerkat scores its own suite).

## 4. Core Features

> Each feature lists exact acceptance values. A scenario without an exact value is
> not a valid scenario (see `SPEC.md`).

### 4.1 JUnit ingest
Parses TestSprite's JUnit report.
- 67-testcase report (64 pass, 3 fail, 0 skip) → `total=67, passed=64, failed=3, skipped=0`.
- 10-testcase report with 2 `<skipped/>` → `total=10, passed=6, failed=2, skipped=2`; pass rate is `6/10 = 0.60`, not `6/8`.
- Malformed XML → run `status=parse-error`; the app does **not** crash.

### 4.2 TSI computation (deterministic)
`coverage = covered_ids / total_ids` · `stability = 1 − conflicted/tested` (runs < 2 on the same SHA → `1.0`, labelled *estimated*) · `meaningful_pass = passed AND assertions ≥ 1` · `pass_rate = meaningful_passes / total` · `TSI = round(100 × (0.50×coverage + 0.30×stability + 0.20×pass_rate))`.
- Primary fixture: coverage `60/67`, stability `66/67`, pass `63/67` (1 vacuous) → `TSI = 93`.
- All perfect → `100`; all zero → `0`.
- Rounding is half-up: `95.4999 → 95`, `95.5 → 96`.
- Same input → byte-identical output (no timestamp / randomness inside the score).
- Delta: previous `96`, current `93` → `delta = −3`.

### 4.3 Assertion depth (vacuous / shallow)
Depth comes from each test's own plan: the count of `planSteps` whose `type` is `assertion`.
- A test with **0** assertion steps passes without asserting anything → labelled `vacuous (0 assertions)`, **excluded** from `pass_rate`.
- A passing test with exactly **1** assertion step → labelled `shallow (1 assertion)`; `pass_rate` unchanged (a signal, not a penalty).

### 4.4 Coverage traceability
Maps `SPEC.md` scenario IDs against test names.
- SPEC with 67 IDs, JUnit containing 60 → `coverage = 60/67 = 0.895522`.
- ID matching is **case-sensitive**: a test named `sv-smk-01` does **not** match; it is recorded as an `orphan test`.
- Coverage detail page shows a 67-row table (ID · status · test name); `SV-SMK-01` shows `covered`.

### 4.5 Ratchet (merge gating)
TSI on a PR must not drop below the `main` baseline; otherwise the check blocks the merge.
- Baseline `main` = `96`, PR = `93` → check red, text `TSI dropped 96 → 93 (ratchet)`.
- PR = `96` (equal) → green (ratchet means "not lower", not "must rise").
- PR = `98` → green; baseline on `main` updates to `98` after merge.
- First PR (no baseline) → green; baseline set from the first PR's value.

### 4.6 PR comment (bot)
- Comment line: `TSI 93 (Δ −3 vs main 96)` + 3 metric lines + a run-detail link.
- A second push to the same PR **edits the comment in place** (marker `<!-- suitevitals -->`); total comments stays `1`.

### 4.7 Verdict trust
- A `refused` test (exited by refusal, not assertion) → run `status=incomplete`, labelled `refused (not a failure)`, **not** counted in `failed`, TSI `n/a`.
- An incomplete rerun (3 requested, 2 finished, 1 refused) → label `incomplete rerun refused`, check `neutral` (not green), text `2/3 completed, 1 refused`.

### 4.8 Spec drift detection
- A test fails while its scenario ID was removed from `SPEC.md` since the previous run → classified `spec-drift`, **not** `regression`.
- A PR that only changes `SPEC.md` (adds IDs, no code change) drops TSI via coverage → ratchet `neutral`, label `spec-change only`; baseline unchanged.

### 4.9 Audit trail
Every score traces to its source.
- Clicking TSI `93` lists the JUnit file and the exact testcase rows behind each metric, including the 3 failing testcases.
- Clicking a gap `SV-RAT-05` shows `<spec-path>:<line>` where that line genuinely contains the ID.
- A panel shows the commit `sha` and `run_id`; the link resolves to the public repo at that `sha`.

### 4.10 Auto-remediation loop (headline)
After a red check, Meerkat **classifies the verdict first**, then only dispatches a fix agent when the verdict is trustworthy.
- `refused` → **no action**; label `refused (not a failure)`.
- incomplete rerun → **no action**; label `incomplete rerun refused`.
- `spec-drift` → **test/spec update needed**; application code untouched.
- `regression` (spec unchanged) **+ bundle available** → dispatch agent → commit fix → rerun → green; comment line `loop: regression → fix proposed → green`.
- bundle unavailable → `no bundle — manual loop`; check stays `neutral`.
- A failed fix attempt escalates (`escalated to human`); never retries more than once.

### 4.11 Preview environment matrix
Every PR is tested against **its own preview deployment** (not prod). Each run records `environment` (`preview` / `production`) plus an optional context (e.g. `desktop-auth`, `mobile-auth`, `desktop-anon`).

### 4.12 Public share page
`/s/{slug}` shows a public scorecard (TSI + 3 metrics + delta) and a link to the repo, with no login. Unknown slug → 404.

### 4.13 CLI (companion)
`suitevitals score --junit x.xml --spec SPEC.md` → JSON `{tsi, coverage, stability, pass_rate, gaps}`. Same input → byte-identical output. Missing argument → exit `2`; missing file → exit `3`.

## 5. Architecture Overview

- **Framework:** TanStack Start (React + TypeScript), deployed on Vercel with **per-PR preview deployments**.
- **Database:** Postgres (Neon) + Drizzle ORM.
- **Test ingestion:** TestSprite's own surfaces — the GitHub App (primary path), the run list, run history, and test plans; the JUnit report for the offline path.
- **Scoring engine:** a pure, deterministic module (no clock / randomness inside the score) shared by the dashboard, the CLI, and the bot comment, so all three always agree byte-for-byte.
- **Integration model:** TestSprite decides whether the app works; Meerkat decides whether that verdict is worth acting on. Meerkat never interferes with TestSprite's own blocking behaviour. This repo's pull requests are gated by both.

## 6. Requirements

### 6.1 Functional
- A demo account is seeded on **every preview deployment**: `demo@suitevitals.dev` / `demo-password-1`; sign in at `/login`.
- Visitors can view the public scorecard and the Loop page without login.
- The dashboard (runs list, run detail, coverage table, Loop page, audit trail) requires login with the demo account.
- `POST /api/test/reset` (preview only, secret header) resets demo data.

### 6.2 Non-Functional
- The TSI score is **deterministic**: no `Date.now()` / RNG inside the formula; time is used for display only.
- No scenario asserts on timestamps, random IDs, or relative times.
- The app must not crash on malformed JUnit input (shows a `parse-error` banner instead).
- Rate-limit `POST /api/runs`; demo data resets on each preview deploy.
- Lighthouse ≥ 90 (perf/a11y) on the preview; no console errors on the main flow.

> Full scenario contract (exact values per scenario, 33 total): [`SPEC.md`](SPEC.md).
