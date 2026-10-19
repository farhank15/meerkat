<div align="center">

<img src="publics/meerkat.png" alt="Meerkat — sentinel for your test suite" width="200" />

# Meerkat

### Your suite is green. But is it *meaningful*?

Meerkat scores how strong your test suite really is with the **Test Strength Index
(TSI)** — and shows the evidence behind every number.

[![TestSprite Hackathon S4](https://img.shields.io/badge/TestSprite-Hackathon_S4-blue)](https://www.testsprite.com/hackathon-s4)
[![Engine tests](https://img.shields.io/badge/engine_tests-Vitest_%2B_fast--check-brightgreen)](src/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**[Live demo](https://meerkat-app.vercel.app)** · sign in with `demo@suitevitals.dev` / `demo-password-1`

</div>

---

## Green is not the same as meaningful

A passing check tells you a test ran. It doesn't tell you whether that test covered
the requirement you just changed, or whether it passed because the app works — or
because the assertion was too weak to ever fail.

Meerkat is a quality lens on top of an automated test run — it adds the
interpretation layer a green checkmark can't provide on its own: **does this
passing suite actually match the requirements it was written against?**

## What Meerkat does

- **Scores suite strength, not just pass/fail.** Coverage, stability, and pass rate
  fold into one deterministic number — the **Test Strength Index (TSI)**.
- **Traces every number.** Run detail shows the coverage table (every `SPEC.md`
  scenario ID with `covered` / `gap`), the TSI source breakdown, the audit trail,
  and commit traceability. Nothing is unexplained.
- **Interprets passing results against the contract.** The Verdict-Trust Gate and
  the Vacuous Auditor classify how each pass is anchored to the contract, and
  surface results that deserve a closer look (for example, checks that no longer
  assert meaningful behaviour) — before a team or an agent acts on them.
- **Keeps a live record of runs.** A key-gated ingest endpoint receives each
  CI-reported run into a Postgres datastore; the dashboard and a public TSI badge
  read directly from it.
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
(`SV-TSI-01`: coverage 30/33, stability 65/67, pass 63/67) scores **93**.

## How Meerkat and TestSprite fit together

Meerkat is a **consumer of TestSprite's results, not a replacement for them** —
one layer higher in the pipeline:

- **TestSprite creates and runs the tests** — the GitHub App check runs the suite
  against each PR's preview deployment and reports the required `TestSprite V3`
  check; branch protection on `main` keeps every merge gated on that green result.
  This is the primary path and needs no Starter upgrade.
- **Meerkat interprets and records the runs** — after each App run, free
  read-only CLI calls (`test list`, `test result --history`,
  `test failure summary`) let Meerkat retrieve per-test verdicts, step-level facts,
  and failure bundles, reporting the run into its Neon datastore via the key-gated
  `POST /api/runs` — the same source the public TSI badge live-reads.

One pipeline, two roles: **TestSprite proves the product. Meerkat gives every run
a strength score, an evidence trail, and an interpretation the whole team — and
any code-facing agent — can act on.**

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

## What the TestSprite suite covers

The 39-scenario suite (generated in the TestSprite 3.0 portal from `SPEC.md` +
per-feature plans) runs against each PR's preview deployment and reports back as
a check on the pull request:

- **Entry & auth** — landing → sign in with the demo account (`demo@suitevitals.dev`
  / `demo-password-1`), session persistence, dashboard access.
- **Runs & run detail** — runs list navigation, per-run metrics with the TSI source
  breakdown, verdict labels (refused ≠ failure, incomplete rerun handled).
- **Coverage traceability** — coverage table rows (ID · status · test name), covered
  IDs, gaps traced to their `SPEC.md` line, orphan detection for tests that assert
  no scenario.
- **Audit trail** — clickability from TSI → JUnit testcase rows → `SPEC.md:<line>` →
  commit SHA on the public repo (including from the Loop page).
- **Public share** — `/s/{slug}` scorecard renders without login; unknown slug → 404;
  the first run opens from the scorecard.
- **Loop verdict trust** — verdict summary, spec-drift guidance on the Loop page.
- **Scoring CLI** — score a JUnit file, expected-fixture value (`93`), rounding
  (half-up), determinism (byte-identical re-run), missing-argument exit code,
  malformed-XML handling without a crash.

## Honest by design

Meerkat does not invent data. Stability needs two runs of the same SHA; with one run
it reports `1.0`, labelled *estimated*. Coverage is ID-based — it matches `SPEC.md`
scenario IDs against test names, so it stays a testable contract instead of depending
on how any generator happened to name its files.

The dashboard evidence ships as a **seeded demo fixture** (derived from committed
artifacts — `SPEC.md` and `testsprite-junit.xml`), and the **persistence layer is
real**: accounts live in Neon (Postgres) via Drizzle, CI reports runs through the
key-gated `POST /api/runs` endpoint, and the public TSI badge is served from the
database with a fixture fallback. Sign-in supports password accounts and GitHub
OAuth; the scoring engine itself stays pure and database-independent.

![Test Strength Index](https://meerkat-app.vercel.app/api/badge/tsi.svg)
<sub>The badge is served from the live datastore and falls back to the committed
baseline evidence until the first live run is ingested.</sub>

What is **proven** and what is still a **hypothesis** is tracked in
[`VALIDATION.md`](VALIDATION.md) — including the experiment that could falsify the
metric, and the maturity gates the project has not passed yet.

## Try it

```bash
# Run the scoring engine on your own artifacts
npm run score -- --junit testsprite-junit.xml --spec SPEC.md

# Run the engine test suite (also exercised by the PR's testsprite-junit check)
npm test
```

## Put your agent on the verdict ledger

Meerkat's verdict layer is agent-readable. Any coding agent can pull the latest
run's verdict, coverage gaps and assertion-quality findings — before acting on
the code:

```bash
# One-line read (no install)
curl -s https://meerkat-app.vercel.app/api/agent-brief
```

Or connect it as MCP tools (Claude Code, Cursor, or any MCP host). The server is
read-only — it talks to Meerkat's public HTTP API and holds no database access:

```json
{
  "mcpServers": {
    "meerkat-verdict": {
      "command": "node",
      "args": ["/absolute/path/to/meerkat/mcp/server.mjs"]
    }
  }
}
```

| Tool | Answer |
|---|---|
| `get_run_verdict` | latest verdict: TSI, state (green / incomplete / refused-label), run SHA |
| `get_coverage_gaps` | `SPEC.md` scenarios with no asserting test, each with its contract line |
| `get_vacuous_findings` | assertion-quality state + vacuous/orphan/conflict counts |
| `get_tsi_summary` | everything above in one call |

Prefer a browser? The same guide ships in the app at
[`/agent`](https://meerkat-app.vercel.app/agent) — curl one-liner, MCP config,
and the tool contract, click-to-copy.

`npm run ingest` rebuilds the ledger from the latest TestSprite run (read-only
CLI reads) and `npm run mcp:smoke` proves the tool contract end-to-end.

## Built with

| Layer | Choice |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React + TypeScript) |
| Hosting | Vercel, with per-PR preview deployments |
| Styling | Tailwind CSS |
| Engine tests | Vitest + fast-check (property-based) |
| Test ingestion | TestSprite (GitHub App PR check + read-only CLI reads) |

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

<img src="publics/meerkat.png" alt="Meerkat" width="110" />

**Meerkat — your suite is green. But is it *meaningful*?**

*Built for TestSprite Hackathon Season 4 · October 2026*

</div>
