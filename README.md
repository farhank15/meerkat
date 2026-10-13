<div align="center">

<img src="publics/meerkat.png" alt="Meerkat — sentinel for your test suite" width="220" />

# Meerkat

**Your suite is green. But is it *meaningful*?**

...and the loop only closes when the verdict is trustworthy.

Meerkat builds on [TestSprite](https://www.testsprite.com)'s verdicts — it adds a **trust layer** on top, and closes the loop with an auto-fix **only when the verdict is honest**.

[![TestSprite Hackathon S4](https://img.shields.io/badge/TestSprite-Hackathon_S4-blue)](https://www.testsprite.com/hackathon-s4)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Suite](https://img.shields.io/badge/suite-96_scenarios-brightgreen)](#-test-coverage)
[![Loop](https://img.shields.io/badge/loop-auto--remediation-8A2BE2)](#-the-loop)
[![Preview](https://img.shields.io/badge/preview-per--PR-blueviolet)](#-wired-for-real)
[![PR checks: blocking](https://img.shields.io/badge/PR_checks-blocking-brightgreen)](#-proof-the-loop)

<!-- Links marked TODO are filled with real URLs during the build window (Oct 16–22). -->

[Live demo](https://meerkat.vercel.app) *(TODO: deploy)* · [Share page](https://meerkat.vercel.app/s/demo) *(TODO)* · [Demo video]() *(TODO)*

</div>

---

## What is Meerkat?

Meerkats stand tall and watch over their colony — one sentinel always on duty. **Meerkat does the same for your test suite.** It stands watch over every pull request and asks the question green checkmarks never ask: *does this green actually mean anything?*

Concretely, Meerkat **extends** your TestSprite setup:

- It reads the JUnit report [`testsprite-action`](https://github.com/TestSprite/testsprite-action) already produces on every PR, parses your `SPEC.md`, and computes the **Test Strength Index (TSI)** — coverage, stability, pass rate.
- It adds a **trust layer** to the verdict: a refused run is not a failure, an incomplete rerun never passes the gate, a diff against a run with no verdict is refused.
- It **tells spec-drift apart from bugs**: a failing test caused by a changed spec is classified `spec-drift`, not `regression`.
- And then it **closes the loop** — but only when the verdict is trustworthy: a real regression with a failure bundle gets an agent that reads the bundle, fixes the root cause, and pushes the fix to the PR. A refused, incomplete, or drifted verdict **never** triggers a code change.

**Who is it for?** Maintainers and reviewers of AI-coded repos who already have green TestSprite checks and need to know whether that green means anything — before they merge.

## Why this exists

> *"AI-generated tests fail in a way that's worse than failing. They pass."*

Green tests that catch nothing — and verdicts that can't be trusted — are the defining QA problems of the AI-coding era. Research backs it: of 1,000 ChatGPT-produced unit tests, only **24.8% executed cleanly** (Yuan et al., FSE 2024); coverage correlates only **weakly** with fault detection once suite size is controlled (Inozemtseva & Holmes, ICSE 2014); and on potentially-buggy code, coverage–detection correlations for LLM suites are **uniformly weak** (ISSTA 2026).

A verdict per PR answers *"did it pass?"* — but four questions still need an answer:

1. **Which of my requirements does this green suite actually cover?** (and which leak?)
2. **Is the green stable, or lucky?** (flake rate)
3. **Did test strength go up or down since the last PR?**
4. **Can I trust this verdict at all** — and if so, **who fixes the failure?**

Meerkat answers all four — and acts on the fourth.

## How it works

Drop one Action into your workflow. Meerkat reads the JUnit report [`testsprite-action`](https://github.com/TestSprite/testsprite-action) already produces, parses your `SPEC.md`, and computes the **Test Strength Index**:

```
coverage   = covered_ids / total_ids          # SPEC.md scenario IDs ↔ test names in JUnit
stability  = 1 − conflicted/tested            # same-SHA reruns; <2 runs → 1.0 (labeled estimated)
pass_rate  = passed / total
TSI        = round(100 × (0.50×coverage + 0.30×stability + 0.20×pass_rate))
```

Every input is on disk, every formula is deterministic — **the same files always produce the same TSI, byte for byte.** No timestamps, no randomness inside the score.

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
| **Ratchet check** | A separate status check that **blocks merge when TSI drops below the `main` baseline** |
| **Verdict audit** | Refused tests labeled `refused (not a failure)`; incomplete reruns hold the gate at `neutral`; diffs against verdict-less runs are refused |
| **Drift classification** | Failures caused by a changed spec are labeled `spec-drift`, not `regression` |
| **Auto-remediation loop** | A trustworthy regression gets a fix commit on the PR branch — visible, gated, reviewable |
| **Per-PR preview** | Every PR is tested against its **own preview deployment**, across a context matrix — not prod |
| **Step narrative** | Failures come back as *"failed at step 3/5: click 'Verify' — expected '95', received '96'"*, parsed from TestSprite's own failure bundle |
| **Coverage gaps** | Run detail lists every `SPEC.md` scenario ID with `covered` / `gap` status |
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
  "pass_rate": 0.955224,
  "gaps": ["SV-COV-07", "SV-RAT-06"]
}
```

Same fixture → same JSON, **byte-identical** to the dashboard's number for the same files.

## 📊 Test coverage

**96 scenarios across 16 families** (58 core + 38 extended), all with exact expected values in [`docs/SPEC.md`](docs/SPEC.md) — coverage breadth *and* assertion depth: every scenario asserts at least one exact number, label, or line, never just "renders correctly".

| Family | # | Focus |
|---|:---:|---|
| **SMK** | 4 | Landing, API health, CLI hello, share page |
| **CFG** | 6 | Action config (defaults, missing key, bad paths) |
| **ENV** | 4 | **Per-PR preview matrix (environment, context, aggregation)** |
| **ING** | 6 | JUnit parsing (counts, skips, malformed, missing, multi-suite) |
| **DSH** | 8 | Dashboard (tables, detail, history, empty, auth, **Loop page**) |
| **COV** | 9 | Traceability (match, gaps, case, orphans, update, empty, table) |
| **DRF** | 3 | Spec drift (drift-vs-bug, added/removed, spec-only neutral) |
| **RAT** | 6 | Ratchet (drop blocks, equal passes, baseline update) |
| **TSI** | 8 | Formula (exact fixture → **93**, rounding, determinism) |
| **PRM** | 5 | PR comment (content, edit-in-place, permissions) |
| **FLK** | 6 | Stability (conflicts, same SHA, renames) |
| **VDT** | 3 | Verdict trust (refused≠failed, incomplete rerun, unverdictable diff) |
| **NAR** | 10 | Step narrative (failing step, snapshot guard, fallback, cap) |
| **FIX** | 8 | **Auto-remediation loop (gate per verdict, dispatch, non-gating, record)** |
| **CLI** | 6 | `score` command (JSON, exit codes, defaults) |
| **ERR** | 4 | Malformed input, network failure, auth, zero tests |

Example of the exact-value assertions the suite runs:

```text
TSI-01: coverage 60/67, stability 66/67, pass 64/67
        → TSI = round(100×(0.50×0.895522 + 0.30×0.985075 + 0.20×0.955224)) = 93

VDT-01: test refused (not failed) → run status=incomplete, TSI n/a (never counted as failure)

DRF-01: SV-COV-07 fails but its ID was removed from SPEC → spec-drift, not regression

FIX-01: regression + bundle → agent fix commit → rerun TSI 93 → green
        ("loop: regression → fix proposed → green")
```

## 🔌 Wired for real (the S4 loop, in depth)

Meerkat exists *inside* the Season 4 loop — every layer below is a real integration, not a logo:

| S4 step | What runs here |
|---|---|
| **Suite (3.0 portal)** | Agents explore the live app and generate the 96-test suite with exact-value assertions (`SV-XXX-NN` naming contract) |
| **Wire-up (Actions)** | `TestSprite/testsprite-action@v1` runs the full suite on every PR **against that PR's preview deployment** (Environments placeholder), writes the JUnit report |
| **Check (PR)** | Two checks per push: TestSprite's verdict + Meerkat's ratchet (TSI vs `main` baseline) + PR comment with score, delta, gaps, drift, and the loop decision |
| **Fix loop (F20)** | On a trustworthy regression, an agent reads TestSprite's own `failure bundle` off the PR (`failed at step 3/5`, exact assertion, snapshot) and pushes a fix — push reruns everything to green |
| **Beyond the loop** | Meerkat adds a trust layer to TestSprite's verdicts (refused≠failed), classifies drift-vs-bug, and only then decides whether to act |

Without TestSprite there is no suite, no verdict, no bundle, no gate — Meerkat is instrumentation *and a gated fix loop on top of* the TestSprite pipeline, and this repo's own PRs are gated by it (dogfooding).

## 🏅 Proof: the loop

| Evidence | Where |
|---|---|
| Every PR automatically tested | Status checks + PR comment *(TODO: link)* |
| Red → agent fix → green, caught by a real check | Example PR *(TODO: link)* |
| Suite blocks a merge | Branch protection + required status checks *(TODO)* |

*Links filled with real PR references during the build window (Oct 16–22). This table is the submission story: judges read the whole loop off the PR — red, fix, green.*

## 🧮 Dogfooding (the point)

Meerkat scores **its own** suite. The dashboard you open in the demo is fed by the same Action that gates this repo's PRs — the tool eats its own cooking:

- TSI history for this repo, visible on the share page
- Coverage table for the 96 scenarios above
- Ratchet active on this repo since the gate PR
- Loop page: this repo's own red→green PRs

## 🔬 Implementation notes (honest scope)

- **Coverage is ID-based, not source-based.** Test files generated by TestSprite aren't readable from the repo, so coverage maps `SPEC.md` scenario IDs (matched *case-sensitively* in test names) — a testable contract instead of a guess.
- **Stability needs ≥2 runs of the same SHA**; with 1 run it reports `1.0` labeled *estimated* — we never invent flakiness data.
- **The loop is gated, not autonomous.** The agent only acts on a `regression` verdict with a bundle; refused/incomplete/drift never touch code. A failed fix escalates to a human (max 1 attempt).
- **Ratchet is a separate check from TestSprite's** — Meerkat never interferes with TestSprite's own blocking behavior.
- **We don't claim novelty for the commodity parts.** Mutation testing, flaky detection, and test impact analysis are prior art — see [`docs/INTEGRATION.md`](docs/INTEGRATION.md) §3. Meerkat's contribution is the *verdict-audited loop*.

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
| Test ingestion | [`testsprite-action@v1`](https://github.com/TestSprite/testsprite-action) (JUnit + outputs) |
| Engine tests | Vitest + fast-check (property-based) |
| CLI | Node + TypeScript, zero-config defaults |

## 📜 License

MIT — see [LICENSE](LICENSE).

## 🙏 Thanks

- [TestSprite Hackathon S4](https://www.testsprite.com/hackathon-s4) and the [`testsprite-action`](https://github.com/TestSprite/testsprite-action) team for the JUnit + failure-bundle pipeline this tool stands on
- Everyone in QA who keeps asking *"but does it actually catch anything — and who fixes it?"*

---

<div align="center">

<img src="publics/meerkat.png" alt="Meerkat" width="120" />

**Meerkat — your suite is green. But is it *meaningful*?**

*Built for TestSprite Hackathon S4 · Oct 16–22, 2026*

</div>
