<div align="center">

<img src="publics/meerkat.png" alt="Meerkat — sentinel for your test suite" width="200" />

# Meerkat

### Your suite is green. But is it *meaningful*?

Meerkat reads TestSprite's verdicts, scores how strong your suite really is,
and closes the loop only when that verdict can be trusted.

[![TestSprite Hackathon S4](https://img.shields.io/badge/TestSprite-Hackathon_S4-blue)](https://www.testsprite.com/hackathon-s4)
[![Suite](https://img.shields.io/badge/suite-33_core_scenarios-brightgreen)](SPEC.md)
[![Loop](https://img.shields.io/badge/loop-verdict--audited-8A2BE2)](#the-loop)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**[Live demo](https://meerkat-app.vercel.app)**

</div>

---

## Green is not the same as meaningful

A passing check tells you a test ran. It doesn't tell you whether that test asserted
anything, whether it covers the requirement you just changed, or whether it passed
because the app works — or because the assertion was too weak to ever fail.

Meerkats stand tall and watch over the colony: one sentinel always on duty. **Meerkat
does the same for your test suite.** It stands watch over every pull request and asks
the question green checkmarks never ask.

*For maintainers and reviewers of AI-coded repos who already have green TestSprite
checks and need to know whether that green means anything — before they merge.*

## What Meerkat does

- **Scores suite strength, not just pass/fail.** Coverage, stability, assertion depth, and pass rate fold into one number — the **Test Strength Index (TSI)**.
- **Catches the vacuous pass.** A test that passes without asserting anything is counted, labelled `vacuous`, and excluded from the score. Green that proves nothing is not green.
- **Adds a trust layer to the verdict.** A refused run is not a failure. An incomplete rerun never passes the gate. A diff against a run with no verdict is refused.
- **Tells spec-drift apart from bugs.** A failure caused by a changed spec is labelled `spec-drift`, not `regression`.
- **Traces every number.** Click any score to see the test rows behind it, the line in `SPEC.md`, and the commit SHA. Nothing is unexplained.
- **Tracks the trend.** Every run is compared to the `main` baseline, so "did test strength go up or down since the last PR?" has an answer.

## The loop

Meerkat's headline feature is what happens *after* a red check. Every failure is
classified **before** anything is touched:

| Verdict classification | Action | Label |
|---|---|---|
| `refused` (not a failure) | **no action** | `refused (not a failure)` |
| incomplete rerun | **held** | `incomplete rerun refused` |
| `spec-drift` (spec changed, not code) | **test update needed** | `spec-drift — test update needed` |
| `regression` + bundle available | **agent fixes the code → push → rerun** | `regression — fix proposed` |
| bundle missing | manual | `no bundle — manual loop` |

An agent only touches your code when the verdict is a genuine regression. A refused or
drifted verdict — the two ways green-checkmark tools silently lie — **never** triggers a
fix. The loop is recorded on the PR and on the dashboard's **Loop** page.

## Every pull request, in full

| Signal | What you get |
|---|---|
| **TSI + delta** | Comment on your PR: index, coverage, stability, pass rate, and the change vs. the last run |
| **Assertion depth** | Per-test `expect`-step counts. A pass with **zero** assertions is labelled `vacuous` and excluded from pass rate; a 1-assertion pass is labelled `shallow` |
| **Ratchet check** | A separate status check that **blocks merge when TSI drops below the `main` baseline** |
| **Verdict audit** | Refused tests labelled `refused (not a failure)`; incomplete reruns hold the gate at `neutral`; diffs against verdict-less runs are refused |
| **Drift classification** | Failures caused by a changed spec are labelled `spec-drift`, not `regression` |
| **Auto-remediation** | A trustworthy regression gets a fix commit on the PR branch — visible, gated, reviewable |
| **Per-PR preview** | TestSprite runs each PR against **that PR's own deployment**, not prod — Meerkat adds an optional context matrix on top |
| **Step narrative** | Failures come back as *"failed at step 3/5: click 'Verify' — expected '95', received '96'"*, parsed from TestSprite's own failure bundle |
| **Coverage gaps** | Run detail lists every `SPEC.md` scenario ID with `covered` / `gap` status |
| **Audit trail** | Click any score to see the test rows behind it, the `SPEC.md` line, and the commit SHA |
| **Flake table** | Tests that passed in one run and failed in another run of the *same SHA* |

## The Test Strength Index

```
coverage        = covered_ids / total_ids          # SPEC.md scenario IDs ↔ test names in TestSprite
stability       = 1 − conflicted/tested            # same-SHA reruns; <2 runs → 1.0 (labelled estimated)
assertions      = steps with action "expect", per test   # from `testsprite test steps`
meaningful_pass = passed AND assertions ≥ 1         # a 0-assertion pass is "vacuous" and excluded
pass_rate       = meaningful_passes / total
TSI             = round(100 × (0.50×coverage + 0.30×stability + 0.20×pass_rate))
```

Every input comes from TestSprite's own surfaces, and every formula is deterministic —
**the same run data always produces the same TSI, byte for byte.** No timestamps, no
randomness inside the score.

```text
TSI-01: coverage 60/67, stability 66/67, pass 63/67 (1 vacuous)
        → TSI = round(100×(0.50×0.895522 + 0.30×0.985075 + 0.20×0.940299)) = 93

ADQ-02: 5 steps, 0 expect steps, status passed
        → labelled "vacuous (0 assertions)", excluded from pass rate

FIX-01: regression + bundle → agent fix commit → rerun TSI 93 → green
        ("loop: regression → fix proposed → green")
```

## Built on TestSprite

The **TestSprite GitHub App** is the primary path: drop it on your repo and every pull
request gets tested against its own deployment — *"Nothing is added to your repository."*
TestSprite's per-repo switches (**Base Branch**, **Environment**, **Include Draft PRs**,
**Blocking PRs**, **Run affected tests on its pull requests**) decide what runs and
whether it holds the merge. The App reports back as a `testsprite-dev` comment that
updates in place.

Meerkat then reads TestSprite's own run data — `test list`, `test result --history`,
`test steps` — and adds a **second, independent check**: `SuiteVitals Ratchet`, carrying
the score, the delta, the gaps, the drift classification, and the loop decision.

Two checks, two jobs: **TestSprite decides whether the app works. Meerkat decides whether
that verdict is worth acting on.** Meerkat never interferes with TestSprite's own
blocking behaviour. This repo's own pull requests are gated by both.

## What the suite covers

**33 core scenarios across 12 families**, every one asserting at least one exact number,
label, or line — never just "renders correctly". The suite is sized to run on **every**
pull request within a free-tier credit budget, and grows one PR at a time.

| Family | # | Focus |
|---|:---:|---|
| **SMK** | 2 | Landing scorecard, API health |
| **CFG** | 2 | Action defaults, draft PRs |
| **ING** | 3 | JUnit parsing (counts, skips, malformed) |
| **TSI** | 4 | Formula (exact fixture → **93**, rounding, determinism, delta) |
| **ADQ** | 3 | Assertion depth (per-test `expect` count, vacuous pass caught, shallow pass flagged) |
| **COV** | 3 | Traceability (partial match, case-sensitivity, detail table) |
| **RAT** | 3 | Ratchet (drop blocks, baseline update, two checks) |
| **PRM** | 2 | PR comment (content, edit-in-place) |
| **VDT** | 2 | Verdict trust (refused ≠ failed, incomplete rerun) |
| **DRF** | 2 | Spec drift (drift-vs-bug, spec-only neutral) |
| **AUD** | 3 | Audit trail (TSI → test rows, gap → SPEC line, SHA provenance) |
| **FIX** | 4 | Auto-remediation (regression → green, refused gate, drift gate, escalation) |

The full contract lives in [`SPEC.md`](SPEC.md). That file is also the oracle for the
audit trail — every score Meerkat reports traces back to a line in it.

## Honest by design

Meerkat does not invent data. Stability needs two runs of the same SHA; with one run it
reports `1.0`, labelled *estimated*, rather than guessing at flakiness. Assertion depth
comes from TestSprite's own step surface; when step data isn't available, pass rate falls
back to plain `passed/total`, labelled *estimated*. Coverage is ID-based, because
TestSprite-generated test files aren't readable from your repo — a testable contract
instead of a guess. And we don't claim novelty for the commodity parts: mutation testing,
flake detection, and test-impact analysis are established prior art. Meerkat's
contribution is the **verdict-audited loop**.

## Built with

| Layer | Choice |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React + TypeScript) |
| Hosting | Vercel, with per-PR preview deployments |
| Database | Postgres (Neon) + Drizzle ORM |
| Styling | Tailwind CSS |
| Test ingestion | TestSprite platform runs — `test list` · `test result --history` · `test steps`; the JUnit report for the offline path |
| Engine tests | Vitest + fast-check (property-based) |
| CLI | Node + TypeScript, zero-config defaults |

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

## Thanks

- [TestSprite Hackathon Season 4](https://www.testsprite.com/hackathon-s4), the TestSprite **GitHub App**, and the failure-bundle pipeline this tool stands on
- Everyone in QA who keeps asking *"but does it actually catch anything — and who fixes it?"*

---

<div align="center">

<img src="publics/meerkat.png" alt="Meerkat" width="110" />

**Meerkat — your suite is green. But is it *meaningful*?**

*Built for TestSprite Hackathon Season 4 · October 2026*

</div>
