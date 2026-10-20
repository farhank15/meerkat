# Meerkat — TestSprite Hackathon S4 Submission

## Public App
- Live URL: https://meerkat-app.vercel.app (deployed for the whole build phase)
- Public share scorecard example: https://meerkat-app.vercel.app/share/meerkat-demo

## TestSprite 3.0
- Project ID: `938f6b63-63d6-4bcd-bff4-13e3f035868c`
- Suite generated in the TestSprite 3.0 portal against the live app.
- GitHub App installed; the `TestSprite V3` check runs on every PR.

## Pull Request
- PR #9 `feat/tenancy-saas` → `main`, **merged 2026-10-20** (inside the Oct 16–22 window).
- Final wave: `TestSprite V3` green with **44/44 scenarios passing**.
- The check is **required** by branch protection on `main`, so a red suite blocks the merge
  instead of decorating it.
- "Block PR until tests pass" is also available in the portal for bonus score.

## What Meerkat does
Meerkat is a trust-gate console for CI test runs. It ingests TestSprite/SuiteVitals
results, computes a **Test Strength Index (TSI)**, and surfaces honest signals other
dashboards hide: vacuous passes, shallow assertions (1-assertion tests), orphan
specs, and escalation-to-human loops. The public share scorecard is reachable
without a session.
