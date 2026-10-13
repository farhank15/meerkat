<div align="center">

<img src="publics/meerkat.png" alt="Meerkat — sentinel for your test suite" width="220" />

# Meerkat

**Your suite is green. But is it *meaningful*?**

...and the loop only closes when the verdict is trustworthy.

Meerkat builds on [TestSprite](https://www.testsprite.com)'s verdicts — it adds a **trust layer** on top, and closes the loop with an auto-fix **only when the verdict is honest**.

[![TestSprite Hackathon S4](https://img.shields.io/badge/TestSprite-Hackathon_S4-blue)](https://www.testsprite.com/hackathon-s4)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Suite](https://img.shields.io/badge/suite-33_core_scenarios-brightgreen)](SPEC.md)
[![Loop](https://img.shields.io/badge/loop-auto--remediation-8A2BE2)](#-the-loop)
[![Preview](https://img.shields.io/badge/preview-per--PR-blueviolet)](#-wired-for-real)
[![PR checks: blocking](https://img.shields.io/badge/PR_checks-blocking-brightgreen)](#-proof-the-loop)

<!-- Links marked TODO are filled with real URLs during the build window (Oct 16–22). -->

[Live demo](https://meerkat-app.vercel.app) · [Share page](https://meerkat-app.vercel.app/s/demo) *(TODO)* · [Demo video]() *(TODO)*

</div>

---

## What is Meerkat?

Meerkats stand tall and watch over their colony — one sentinel always on duty. **Meerkat does the same for your test suite.** It stands watch over every pull request and asks the question green checkmarks never ask: *does this green actually mean anything?*

Concretely, Meerkat **extends** your TestSprite setup:

- It reads TestSprite's own run data (and the JUnit report, for the offline path), parses your `SPEC.md`, and computes the **Test Strength Index (TSI)** — coverage, stability, assertion depth, pass rate.
- It measures **assertion depth**: a test that passes without asserting anything is a *vacuous pass* — counted, flagged, and excluded from the score, not silently trusted.
- It adds a **trust layer** to the verdict: a refused run is not a failure, an incomplete rerun never passes the gate, a diff against a run with no verdict is refused.
- It **tells spec-drift apart from bugs**: a failing test caused by a changed spec is classified `spec-drift`, not `regression`.
- And then it **closes the loop** — but only when the verdict is trustworthy: a real regression with a failure bundle gets an agent that reads the bundle, fixes the root cause, and pushes the fix to the PR. A refused, incomplete, or drifted verdict **never** triggers a code change.

**Who is it for?** Maintainers and reviewers of AI-coded repos who already have green TestSprite checks and need to know whether that green means anything — before they merge.

## Why this exists

> *"AI-generated tests fail in a way that's worse than failing. They pass."*

Green tests that catch nothing — and verdicts that can't be trusted — are the defining QA problems of the AI-coding era. Research backs it: of 1,000 ChatGPT-produced unit tests, only **24.8% executed cleanly** (Yuan et al., FSE 2024); coverage correlates only **weakly** with fault detection once suite size is controlled (Inozemtseva & Holmes, ICSE 2014); on potentially-buggy code, coverage–detection correlations for LLM suites are **uniformly weak** (ISSTA 2026); and **82.9–99.4%** of AI-generated test files miss behavioral cases while **62.4–93.1%** carry weak or absent assertions. A test that asserts nothing passes forever and catches nothing — the false-pass failure mode that a pass/fail count cannot see.

A verdict per PR answers *"did it pass?"* — but five questions still need an answer:

1. **Which of my requirements does this green suite actually cover?** (and which leak?)
2. **Is the green stable, or lucky?** (flake rate)
3. **Does the green actually assert anything?** (assertion depth — vacuous passes)
4. **Did test strength go up or down since the last PR?**
5. **Can I trust this verdict at all** — and if so, **who fixes the failure?**

Meerkat answers all five — and acts on the fifth.

## How it works

Drop the **GitHub App** on your repo — every pull request gets tested on its own, with nothing added to your repository. Then add Meerkat: it reads TestSprite's own run data, parses your `SPEC.md`, and computes the **Test Strength Index**:

```
coverage        = covered_ids / total_ids          # SPEC.md scenario IDs ↔ test names in TestSprite
stability       = 1 − conflicted/tested            # same-SHA reruns; <2 runs → 1.0 (labeled estimated)
assertions      = steps with action "expect", per test   # from `testsprite test steps`
meaningful_pass = passed AND assertions ≥ 1         # a 0-assertion pass is "vacuous" and excluded
pass_rate       = meaningful_passes / total
TSI             = round(100 × (0.50×coverage + 0.30×stability + 0.20×pass_rate))
```

Every input comes from TestSprite's own surfaces, every formula is deterministic — **the same run data always produces the same TSI, byte for byte.** No timestamps, no randomness inside the score.

## 🔁 The loop

The point of Meerkat is what happens *after* a red check. Every failure is classified **before** anything is touched:

| Verdict classification | Action | Label |
|---|---|---|
| `refused` (not a failure) | **no action** | `refused (not a failure)` |
| incomplete rerun | **held** | `incomplete rerun refused` |
| `spec-drift` (spec changed, not code) | **test update needed** | `spec-drift — test update needed` |
| `regression` + bundle available | **agent fixes the code → push → rerun** | `regression — fix proposed` |
| bundle missing | manual | `no bundle — manual loop` |

An agent only touches your code when the verdict is a genuine regression. A refused or drifted verdict — the two ways green-checkmark tools silently lie — **never** triggers a fix. The loop is recorded on the PR and on the dashboard's **Loop** page.

## What you get per PR

| Signal | What it does |
|---|---|
| **TSI + delta** | Comment on your PR: index, coverage, stability, pass rate, and change vs. last run |
| **Assertion depth** | Per-test `expect`-step counts; a pass with **zero** assertions is labeled `vacuous` and excluded from pass rate (`assertions 63/67 (1 vacuous)`), a 1-assertion pass is labeled `shallow` |
| **Ratchet check** | A separate status check that **blocks merge when TSI drops below the `main` baseline** |
| **Verdict audit** | Refused tests labeled `refused (not a failure)`; incomplete reruns hold the gate at `neutral`; diffs against verdict-less runs are refused |
| **Drift classification** | Failures caused by a changed spec are labeled `spec-drift`, not `regression` |
| **Auto-remediation loop** | A trustworthy regression gets a fix commit on the PR branch — visible, gated, reviewable |
| **Per-PR preview** | TestSprite's App runs each PR against **that PR's own deployment** (not prod) — Meerkat adds an optional context matrix on top |
| **Step narrative** | Failures come back as *"failed at step 3/5: click 'Verify' — expected '95', received '96'"*, parsed from TestSprite's own failure bundle |
| **Coverage gaps** | Run detail lists every `SPEC.md` scenario ID with `covered` / `gap` status |
| **Audit trail** | Click any score to see the test rows behind it, the `SPEC.md` line, and the commit SHA — the number is never unexplained |
| **Flake table** | Tests that passed in one run and failed in another run of the *same SHA* |

## 🖥 CLI

The same numbers, locally — no account, no network:

```bash
npx suitevitals score --junit testsprite-junit.xml --spec SPEC.md
```

```json
{
  "tsi": 93,
  "coverage": 0.895522,
  "stability": 0.985075,
  "pass_rate": 0.940299,
  "assertions": { "meaningful": 63, "vacuous": 1, "shallow": 4 },
  "gaps": ["SV-COV-07", "SV-RAT-06"]
}
```

Same fixture → same JSON, **byte-identical** to the dashboard's number for the same files.

## 📊 Test coverage

**33 core scenarios across 12 families**, all with exact expected values — coverage breadth *and* assertion depth: every scenario asserts at least one exact number, label, or line, never just "renders correctly".

The full contract lives in [`SPEC.md`](SPEC.md). That file is also the oracle for the audit trail — every score Meerkat reports traces back to a line in it. The suite is deliberately sized to run on **every** pull request within a free-tier credit budget, and grows one PR at a time.

| Family | # | Focus |
|---|:---:|---|
| **SMK** | 2 | Landing scorecard, API health |
| **CFG** | 2 | Action defaults, draft PRs |
| **ING** | 3 | JUnit parsing (counts, skips, malformed) |
| **TSI** | 4 | Formula (exact fixture → **93**, rounding, determinism, delta) |
| **ADQ** | 3 | **Assertion depth (per-test `expect` count, vacuous pass caught, shallow pass flagged)** |
| **COV** | 3 | Traceability (partial match, case-sensitivity, detail table) |
| **RAT** | 3 | Ratchet (drop blocks, baseline update, two checks) |
| **PRM** | 2 | PR comment (content, edit-in-place) |
| **VDT** | 2 | Verdict trust (refused ≠ failed, incomplete rerun) |
| **DRF** | 2 | Spec drift (drift-vs-bug, spec-only neutral) |
| **AUD** | 3 | **Audit trail (TSI → test rows, gap → SPEC line, SHA provenance)** |
| **FIX** | 4 | **Auto-remediation loop (regression → green, refused gate, drift gate, escalation)** |

Example of the exact-value assertions the suite runs:

```text
TSI-01: coverage 60/67, stability 66/67, pass 63/67 (1 vacuous)
        → TSI = round(100×(0.50×0.895522 + 0.30×0.985075 + 0.20×0.940299)) = 93

ADQ-02: 5 steps, 0 expect steps, status passed
        → labeled "vacuous (0 assertions)", excluded from pass rate
        ("assertions 63/67 (1 vacuous)")

VDT-01: test refused (not failed) → run status=incomplete, TSI n/a (never counted as failure)

DRF-01: SV-COV-07 fails but its ID was removed from SPEC → spec-drift, not regression

FIX-01: regression + bundle → agent fix commit → rerun TSI 93 → green
        ("loop: regression → fix proposed → green")
```

## 🔌 Wired for real (the S4 loop, in depth)

Meerkat exists *inside* the Season 4 loop — every layer below is a real integration, not a logo:

| S4 step | What runs here |
|---|---|
| **Suite (3.0 portal)** | Agents explore the live app and generate the 33-scenario core suite from [`SPEC.md`](SPEC.md), with exact-value assertions (`SV-XXX-NN` naming contract). The suite must exist before the check can run. |
| **Wire-up (GitHub App)** | The **TestSprite GitHub App** is the primary path — *"Nothing is added to your repository."* Per-repo switches: **Base Branch**, **Environment**, **Include Draft PRs**, **Blocking PRs** (turns the result into a status check that holds the merge), and **Run affected tests on its pull requests**. PR runs execute against **that PR's own deployment**. |
| **Check (PR)** | The App posts a `testsprite-dev` comment that updates in place — in-progress first, then the pass/fail report naming the failing test. Meerkat adds a **second, independent check**: `SuiteVitals Ratchet` (TSI vs the `main` baseline) plus a comment carrying score, delta, gaps, drift, and the loop decision. |
| **Ingest** | Meerkat reads TestSprite's own run data — `test list`, `test result --history`, `test steps` — so assertion depth and per-run history come from the platform, not from guessing. |
| **Fix loop (F20)** | On a trustworthy regression, an agent reads TestSprite's own `failure bundle` off the PR (`failed at step 3/5`, exact assertion, snapshot) and pushes a fix — the push reruns everything to green. |
| **Beyond the loop** | Meerkat adds a trust layer to TestSprite's verdicts (refused ≠ failed), classifies drift-vs-bug, and only then decides whether to act. |

Two checks, two jobs: **TestSprite decides whether the app works. Meerkat decides whether that verdict is worth acting on.** Meerkat never interferes with TestSprite's own blocking behaviour — it is a separate check.

## 🎯 The gaps TestSprite publishes — and which ones Meerkat closes

TestSprite's Season 4 page lists, verbatim, the complaints its own users send in. We didn't have to guess what's broken — they published it. Here is the honest mapping:

| What users report | Closed by |
|---|---|
| *"The verdict said failed, not which step failed."* | ✅ **Step narrative** — `failed at step 3/5: click "Verify" — expected "95", received "96"`, parsed from TestSprite's own failure bundle |
| *"--wait returned before the run finished"* | ✅ **Verdict trust** — a non-terminal run is never scored; an incomplete rerun is labelled `incomplete rerun refused` and holds the gate at `neutral` |
| *"It generated 40 tests. Three were the ones I needed."* | ✅ **Coverage traceability + assertion depth** — every `SPEC.md` ID is `covered` or `gap`, and a pass with zero `expect` steps is labelled `vacuous` and excluded |
| *"Could not tell which PR the check belonged to."* | ✅ **Audit trail** — every score carries the commit `sha` and `run_id`, resolving to the public repo at that exact commit |
| *"CI output is hard to skim when it fails."* | ✅ **PR comment** — one line of summary, three metric lines, and the loop decision, edited in place instead of appended |
| *"I wanted to re-run one test, not the whole suite."* | ➖ Native — the App's **Run affected tests on its pull requests** switch already does this |
| *"A tool description sent my agent to the wrong call."* | ➖ Out of scope — MCP server surface, not Meerkat's |
| *"An MCP call failed silently."* | ➖ Out of scope — same |
| *"Install docs skip the API key step."* | ➖ Out of scope — documentation, not Meerkat's |

**Five of nine, honestly counted.** One more is already handled natively by the App, and the remaining three are MCP and install-docs surfaces — labelled out of scope rather than quietly omitted, because they are somebody else's fix.


## 🏅 Proof: the loop

| Evidence | Where |
|---|---|
| Every PR automatically tested | TestSprite's own `testsprite-dev` comment, updated in place — in-progress first, then the pass/fail report naming the failing test |
| Red → agent fix → green, caught by a real check | Example PR *(TODO: link)* |
| Suite blocks a merge | The App's **Blocking PRs** switch + Meerkat's `SuiteVitals Ratchet` as a required status check *(TODO)* |

*Links filled with real PR references during the build window (Oct 16–22). This table is the submission story: judges read the whole loop off the PR — red, fix, green.*

## 🧮 Dogfooding (the point)

Meerkat scores **its own** suite. The dashboard you open in the demo is fed by the same GitHub App that tests this repo's PRs — the tool eats its own cooking:

- TSI history for this repo, visible on the share page
- Coverage table for the 33 core scenarios in [`SPEC.md`](SPEC.md)
- `SuiteVitals Ratchet` active on this repo since the gate PR
- Loop page: this repo's own red→green PRs

## 🔬 Implementation notes (honest scope)

- **Coverage is ID-based, not source-based.** Test files generated by TestSprite aren't readable from the repo, so coverage maps `SPEC.md` scenario IDs (matched *case-sensitively* in test names) — a testable contract instead of a guess.
- **Assertion depth comes from TestSprite's own step surface, not from source.** `testsprite test steps <test-id>` is the only place per-step `action: expect` is exposed; JUnit does not carry it. When step data is unavailable, pass rate falls back to plain `passed/total` and is labeled `estimated` — we never invent depth.
- **Stability needs ≥2 runs of the same SHA**; with 1 run it reports `1.0` labeled *estimated* — we never invent flakiness data.
- **The loop is gated, not autonomous.** The agent only acts on a `regression` verdict with a bundle; refused/incomplete/drift never touch code. A failed fix escalates to a human (max 1 attempt).
- **Ratchet is a separate check from TestSprite's** — Meerkat never interferes with TestSprite's own blocking behavior.
- **We don't claim novelty for the commodity parts.** Mutation testing, flaky detection, and test impact analysis are established prior art — we don't present them as new. Meerkat's contribution is the *verdict-audited loop*.

## ⚙️ Running yourself

```bash
git clone https://github.com/<you>/meerkat && cd meerkat
npm install

npm run dev        # dashboard on http://localhost:3000
npm run test       # unit + property tests (Vitest + fast-check)
npm run typecheck
```

## 🛠 Tech stack

| Layer | Choice |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React + TypeScript) |
| Hosting | Vercel with per-PR preview deployments |
| DB | Postgres (Neon) + Drizzle ORM |
| Styling | Tailwind CSS |
| Test ingestion | TestSprite platform runs — `test list` · `test result --history` · `test steps`; the JUnit report for the offline/deterministic path |
| Engine tests | Vitest + fast-check (property-based) |
| CLI | Node + TypeScript, zero-config defaults |

## 📜 License

MIT — see [LICENSE](LICENSE).

## 🙏 Thanks

- [TestSprite Hackathon S4](https://www.testsprite.com/hackathon-s4), the TestSprite **GitHub App**, and the failure-bundle pipeline this tool stands on
- Everyone in QA who keeps asking *"but does it actually catch anything — and who fixes it?"*

---

<div align="center">

<img src="publics/meerkat.png" alt="Meerkat" width="120" />

**Meerkat — your suite is green. But is it *meaningful*?**

*Built for TestSprite Hackathon S4 · Oct 16–22, 2026*

</div>
