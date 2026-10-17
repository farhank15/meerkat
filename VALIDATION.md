# Meerkat — Validity & Maturity Record

> This document exists to keep Meerkat honest. It separates what we have **proven**
> from what we **assume**, states the hypothesis the product rests on, and defines
> the evidence that would change our mind. If a claim is not in here, it is not a
> claim we are entitled to make.

Status: **pre-validation**. The engine is built and tested; the metric itself is an
unvalidated hypothesis. Last updated 2026-10-17.

---

## 1. What we claim — and what we do not

**We claim**

- TSI is a deterministic, reproducible **leading indicator** of test-suite strength,
  computed only from artifacts a team already has (JUnit XML + a spec with IDs).
- Every number on the dashboard traces to an artifact: a spec ID, a testcase, a
  commit SHA. Nothing is invented or interpolated.
- A suite can be green and weak at the same time, and that gap is measurable.

**We do not claim**

- That TSI proves correctness, or that a high TSI means the product has no bugs.
- That TSI replaces mutation testing. Mutation score is the established ground truth
  for suite effectiveness; TSI is a cheap proxy for the case where mutation testing
  cannot run (black-box E2E suites against a deployed app).
- That TSI is causally validated. That work is defined in §4 and has not been run.

---

## 2. Evidence ledger

| # | Claim | Status | Evidence |
|---|---|---|---|
| E1 | TSI is deterministic — same input, byte-identical output | **Proven** | `src/lib/scoring.test.ts`, property test over generated counts |
| E2 | Fixture `60/67, 66/67, 63/67` → **93** | **Proven** | exact-value test |
| E3 | Rounding is half-away-from-zero, not `Math.round` | **Proven** | `roundHalfAwayFromZero` + negative-midpoint tests |
| E4 | Malformed JUnit throws `parse-error`, never crashes | **Proven** | `src/lib/junit.test.ts` |
| E5 | Coverage mapping is case-sensitive; gaps and orphans are distinguished | **Proven** | `src/lib/coverage.test.ts` |
| E6 | Stability falls back to `1.0` (labelled *estimated*) with fewer than two runs of the same SHA | **Proven** | `src/lib/tsi.ts:34` |
| E7 | The JUnit parser keeps a verdict per testcase, including `<failure>` and `<error>` messages | **Proven** | `src/lib/junit.test.ts`, `src/lib/fixture.test.ts` |
| E8 | Assertion depth: `0 = vacuous`, `1 = shallow`, `≥2 = meaningful` | **Implemented, unvalidated** | `src/lib/assertionDepth.ts` |
| E9 | Meaningful pass rate predicts real fault detection better than raw pass rate | **Hypothesis — no evidence** | — |
| E10 | TSI rank-correlates with mutation score | **Hypothesis — no evidence** | — |
| E11 | Verdict classification (refused / incomplete / spec-drift / regression) is stable | **Implemented, unvalidated** | `src/lib/classifier.ts` |

Rows E8–E11 are the product's actual intellectual bet. Everything above them is
engineering hygiene.

---

## 3. The hypothesis, stated so it can fail

**H1.** Across repositories with existing test suites, TSI computed from suite
artifacts rank-correlates with mutation score at **Spearman ρ ≥ 0.70**.

**H0.** ρ < 0.50. If this holds, TSI is not a valid proxy for suite strength and the
metric must be redesigned before any product claim is made.

A result between 0.50 and 0.70 is *inconclusive*: it means the direction is right but
the weights or the assertion classifier are wrong. That outcome is publishable too —
it tells us which component carries the signal.

---

## 4. Validation protocol (not yet executed)

### 4.1 Corpus

Selection criteria, fixed before running anything:

- TypeScript/JavaScript, test runner Vitest or Jest
- ≥ 50 tests and ≥ 1,000 LOC of source
- permissive license, tests runnable offline
- pinned commit SHA per repo
- target: 10 repos minimum, 20 preferred

### 4.2 Ground truth

Mutation score per repo via Stryker Mutator (`killed / (killed + survived)`), default
mutation operators, same commit SHA as the treatment run. Mutation testing is slow;
budget one night per batch.

### 4.3 Treatment

For each repo, compute the three TSI components from the same suite:

- coverage: spec-ID traceability, or file-level fallback when no spec exists
- stability: repeated runs of the same SHA (≥ 2) to surface flaky tests
- meaningful pass rate: passes whose assertions survive the strength classifier

### 4.4 Analysis

- Spearman ρ with 95% bootstrap CI between TSI and mutation score
- per-component ablation: which of coverage / stability / pass rate actually carries
  the correlation
- report the failures, not only the wins — repos where TSI and mutation score
  disagree are the most informative data points

### 4.5 Threats to validity

- corpus bias toward well-maintained repos with strong suites
- mutation operators that do not represent real faults
- flaky tests contaminating the stability component
- config drift between the mutation run and the treatment run

### 4.6 Reproducibility

Pinned SHAs, committed Stryker configs, and a script that regenerates every number in
the results table. A result that cannot be regenerated is not a result.

---

## 5. Anti-gaming design

A metric that becomes a gate gets gamed. That is not a risk, it is a certainty
(Goodhart's law), so it has to be designed against:

| Attack | Current exposure | Planned defence |
|---|---|---|
| Add trivial assertions to raise the pass rate | **High** — depth is a count | AST-based strength classes: tautology, existence-only, snapshot, value, behavioural |
| Add tests that assert nothing but touch spec IDs | **Medium** — orphan/gap catches names, not meaning | cross-check spec ID against the assertion target |
| Inflate coverage by naming tests after spec IDs | **Medium** | orphan detection plus review of test-to-spec mapping |
| Chase the absolute score | **High** | ratchet against the repo's own baseline, never a global target |

Until the strength classifier exists, **TSI must not be used as a merge gate**. It is
a triage signal: it tells a reviewer where to look, not what to conclude.

---

## 6. Maturity gates

Each level has an exit condition. We are at L0.

| Level | Meaning | Exit condition | Status |
|---|---|---|---|
| **L0 — Engine correct** | formulas, parsing, determinism | unit + property tests green; fixture reproduces exactly | **Done** (46/46) |
| **L1 — Proxy valid** | the metric measures what it claims | H1 confirmed at ρ ≥ 0.70 with published protocol | Not started |
| **L2 — Product usable** | a team can use it without us | real ingestion, persistence, multi-run history, no seeded fixture | Partial |
| **L3 — Gate trusted** | safe to block a merge | L1 + anti-gaming classifier + ratchet + audited false-positive rate | Not started |

Claiming L2 or L3 before L1 is the failure mode this document exists to prevent.

---

## 7. Known limitations

- **Spec dependency.** Coverage needs a spec with stable IDs. Teams without one get
  the renormalised formula (0.60 stability + 0.40 pass rate) and a weaker signal.
- **TestSprite coupling.** Assertion depth is derived from TestSprite plan steps, so
  the strongest component currently only works for TestSprite-generated suites.
- **Seeded demo data.** The dashboard parses a committed JUnit artifact at build
  time, so every row is traceable, but there is still no ingestion path from a live
  TestSprite run.
- **Single run.** Stability is labelled *estimated* until two runs share a SHA.
- **Client-side session.** The demo gate reads a cookie; it is not a security
  boundary and is not presented as one.

---

## 8. Status snapshot

- Engine tests: **46/46 passing** (`npm test`)
- Typecheck: clean (`npm run typecheck`)
- Build: clean (`npm run build`)
- TestSprite suite: 37 scenarios — results tracked in the pull request check
- Deployment: preview per branch; production after merge

---

## 9. What would falsify this project

Written down on purpose, so the conclusion cannot be moved after the fact:

1. ρ < 0.50 between TSI and mutation score across the corpus.
2. Repos with high TSI and low mutation score that are not explainable by spec
   coverage alone.
3. A trivial attack (bulk trivial assertions) that raises TSI by > 20 points without
   raising mutation score.
4. Evidence that black-box E2E suites — Meerkat's target — do not benefit from
   assertion-strength scoring at all.

If any of these land, the honest response is to change the metric or narrow the
claim, not to reweight the formula until the number looks right.

---

## 10. Literature review — pending

Not yet done, and deliberately not faked. Before any external claim of novelty, this
section must answer:

- How does mutation testing literature define suite effectiveness, and what does it
  say about cheaper proxies?
- What is already published on test smells, weak/tautological assertions, and
  assertion-free tests?
- What is published on flaky-test detection and its effect on suite trust?
- Do any of these cover **black-box E2E suites generated by an LLM**, which is the
  specific gap Meerkat targets?

Until those questions are answered with sources, the correct framing is *"a plausible
proxy with a defined validation plan"*, not *"a validated metric"*.

---

## 11. Change log

| Date | Change |
|---|---|
| 2026-10-17 | Initial record. Engine at L0; H1 defined; validation not started. |
