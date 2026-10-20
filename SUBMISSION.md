# Meerkat — TestSprite Hackathon S4 Submission

## Links

| | |
|---|---|
| **Demo video** | https://youtu.be/Hp3JypVbuJ4 |
| **Live app** | https://meerkat-app.vercel.app |
| **Public scorecard** | https://meerkat-app.vercel.app/share/meerkat-demo |
| **Source** | https://github.com/farhank15/meerkat |

Demo sign-in: `demo@suitevitals.dev` / `demo-password-1`.

## What Meerkat is

A passing test proves a test ran. It does not prove the test covered the requirement
you changed, or that it passed for the right reason. **Meerkat is the layer that
answers that question.**

It ingests a TestSprite run, computes a deterministic **Test Strength Index (TSI)**
from coverage, stability and meaningful pass rate, and surfaces what a green
checkmark hides: vacuous passes, shallow assertions, orphan tests, and whether the
verdict can be trusted at all. Every number traces back to a `SPEC.md` line and the
JUnit row behind it.

Meerkat does not replace TestSprite — it reads TestSprite's results and adds the
interpretation and history a CI check cannot carry.

## TestSprite 3.0 integration

- **Project ID:** `938f6b63-63d6-4bcd-bff4-13e3f035868c`
- The suite was generated in the TestSprite 3.0 portal from `SPEC.md` and the
  per-feature plans, then run against each PR's preview deployment.
- The **GitHub App** is installed; `TestSprite V3` is posted on every pull request.
- **Branch protection on `main` requires that check**, so a red suite blocks the
  merge instead of decorating it.
- Meerkat reads runs through TestSprite's free read-only CLI (`test list`,
  `test result --history`, `test failure summary`) and posts them through the
  key-gated `POST /api/runs`.

## The pull request

- **PR #9** `feat/tenancy-saas` → `main`, **merged 2026-10-20**, inside the
  Oct 16–22 submission window.
- Final wave: `TestSprite V3` **green, 44/44 scenarios passing**.
- The merge was gated on that check, not merged around it.

## Evidence

- **TSI is deterministic.** The same run always scores the same number, byte for
  byte. The committed baseline (`SV-TSI-01`: 30/33 coverage, 65/67 stability,
  63/67 pass) scores **93**.
- **The engine is property-tested** with Vitest + fast-check: formula, half-up
  rounding, determinism, signed delta, JUnit parsing (including malformed XML),
  coverage traceability and gap/orphan detection.
- **The verdict gate withholds.** An incomplete or refused run reports `n/a` rather
  than a number nobody earned. A missing run is never rendered as a good one.
- **Agents can read it.** An MCP server exposes the verdict, the failing scenarios
  with their root-cause notes, the coverage gaps and the assertion-quality findings
  over a read-only HTTP API.
- **It is not hardcoded to one repo.** A second project
  ([split-bill-demo](https://github.com/farhank15/split-bill-demo), its own
  TestSprite project `3098d8cc-8237-4096-b3a3-b4d2f6c233b5`) runs the same loop:
  red PR → Meerkat verdict → agent fix → green 6/6.

## How to try it

1. Open https://meerkat-app.vercel.app and sign in with the demo account.
2. Open the **meerkat-demo** project → latest run: TSI, coverage table, the
   Verdict-Trust Gate and the audit findings.
3. Open https://meerkat-app.vercel.app/share/meerkat-demo without signing in — the
   same evidence, read-only, no account.
4. The README badge reads the same number from the same row.
