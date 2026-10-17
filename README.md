<div align="center">

<img src="publics/meerkat.png" alt="Meerkat — sentinel for your test suite" width="200" />

# Meerkat

### Your suite is green. But is it *meaningful*?

Meerkat scores how strong your test suite really is with the **Test Strength Index
(TSI)** — and shows the evidence behind every number.

[![TestSprite Hackathon S4](https://img.shields.io/badge/TestSprite-Hackathon_S4-blue)](https://www.testsprite.com/hackathon-s4)
[![Engine tests](https://img.shields.io/badge/engine_tests-Vitest_%2B_fast--check-brightgreen)](src/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**[Live demo](https://meerkat-git-feat-phase2-mvp-flaminextdevs-projects.vercel.app)**
· production (`meerkat-app.vercel.app`) goes live once PR #1 merges.

</div>

---

## Green is not the same as meaningful

A passing check tells you a test ran. It doesn't tell you whether that test covered
the requirement you just changed, or whether it passed because the app works — or
because the assertion was too weak to ever fail.

Meerkat stands watch over every pull request and asks the question green checkmarks
never ask: **does this green suite actually catch anything?**

## What Meerkat does

- **Scores suite strength, not just pass/fail.** Coverage, stability, and pass rate
  fold into one deterministic number — the **Test Strength Index (TSI)**.
- **Traces every number.** Run detail shows the coverage table (every `SPEC.md`
  scenario ID with `covered` / `gap`), the TSI source breakdown, the audit trail,
  and commit traceability. Nothing is unexplained.
- **Shares publicly.** Any project can be published to a public, unauthenticated
  scorecard link — unknown slugs return a clean not-found, never a login wall.
- **Runs from your own artifacts.** The companion `suitevitals score` CLI scores a
  TestSprite JUnit result against a `SPEC.md` contract. Same input → byte-identical
  output.

## The Test Strength Index

```
coverage        = covered_ids / total_ids          # SPEC.md scenario IDs ↔ test names
stability       = 1 − conflicted/tested            # <2 runs → 1.0 (labelled estimated)
pass_rate       = meaningful_passes / total_tests
TSI             = round(100 × (0.50×coverage + 0.30×stability + 0.20×pass_rate))
```

Every formula is deterministic — **the same run data always produces the same TSI,
byte for byte.** No timestamps, no randomness inside the score. The seeded demo run
(`SV-TSI-01`: coverage 60/67, stability 66/67, pass 63/67) scores **93**.

## Built on TestSprite

Meerkat is wired into TestSprite two ways:

1. **GitHub Action check on every PR.** The `TestSprite/testsprite-action` runs on
   each pull request and reports a `testsprite-junit` check — the Free-plan-friendly
   path that needs no Starter upgrade. The action also runs Meerkat's own Vitest
   engine suite so the score is independently verified in CI.
2. **Portal exploratory run.** TestSprite's portal explores and exercises the live
   UI (sign-in, run detail, coverage traceability, public share) and reports what
   passes, fails, or is blocked.

Two lenses, one goal: **TestSprite decides whether the app works. Meerkat decides
whether that verdict is worth acting on.**

<sub>Integration verified against TestSprite's documentation —
[GitHub Integration](https://docs.testsprite.com/web-portal/integrations/github-integration) ·
[Reading Results](https://docs.testsprite.com/cli/core/reading-results).</sub>

## What the engine covers

The scoring engine is unit-tested with **Vitest + fast-check** (property-based). Key
areas:

| Area | Focus |
|---|---|
| **TSI** | Formula (exact fixture → **93**), rounding, determinism, delta |
| **JUnit** | Parsing counts, skips, malformed input (throws `parse-error`) |
| **Coverage** | Traceability (partial match, case-sensitivity, gap/orphan detection) |
| **Scoring CLI** | `scoreFromArtifacts` — deterministic score from JUnit + SPEC |

The scenario contract lives in [`SPEC.md`](SPEC.md) and is the oracle for coverage
traceability — every coverage number Meerkat reports traces back to a line in it.

## Honest by design

Meerkat does not invent data. Stability needs two runs of the same SHA; with one run
it reports `1.0`, labelled *estimated*. Coverage is ID-based — it matches `SPEC.md`
scenario IDs against test names, so it stays a testable contract instead of depending
on how any generator happened to name its files.

The demo runs on a **seeded in-memory fixture** (no live database required to run or
test the app). A Neon/Drizzle persistence layer is a planned follow-up; the scoring
engine is already pure and database-independent.

## Try it

```bash
# Run the scoring engine on your own artifacts
npm run score -- --junit testsprite-junit.xml --spec SPEC.md

# Run the engine test suite (also exercised by the PR's testsprite-junit check)
npm test
```

## Built with

| Layer | Choice |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React + TypeScript) |
| Hosting | Vercel, with per-PR preview deployments |
| Styling | Tailwind CSS |
| Engine tests | Vitest + fast-check (property-based) |
| Test ingestion | TestSprite (GitHub Action check + portal exploratory run) |

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

<img src="publics/meerkat.png" alt="Meerkat" width="110" />

**Meerkat — your suite is green. But is it *meaningful*?**

*Built for TestSprite Hackathon Season 4 · October 2026*

</div>
