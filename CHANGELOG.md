# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project documentation: README, contributing guide, security policy, and code
  of conduct.
- **Test Strength Index (TSI)** — deterministic score from the TestSprite JUnit
  report: coverage × stability × pass rate (fixture → 93).
- **Scoring CLI** (`suitevitals score --junit x.xml --spec SPEC.md`) — same
  input, byte-identical output.
- **Dashboard MVP** — runs list, run detail with TSI breakdown, coverage
  traceability, audit trail, Loop page, public share pages (`/s/{slug}`).
- **Hero** — the Meerkat logo is on the landing hero.
- **Suite coverage docs** — the README now documents what the 37-scenario
  TestSprite suite covers.

### Planned

- **Ratchet gate** — a status check that blocks a merge when the score drops
  below the `main` baseline.
- **Verdict audit** — treat a refused run as *not a failure*, hold the gate on
  an incomplete rerun, and refuse a diff against a run with no verdict.
- **Spec-drift detection** — classify a failure caused by a changed spec as
  `spec-drift`, not `regression`.
- **Auto-remediation loop** — a gated fix: an agent acts on a genuine regression
  (with a failure bundle) and never touches code when the verdict is not
  trustworthy.
- **Per-PR preview testing** — run the suite against each pull request's own
  preview deployment.

[Unreleased]: https://github.com/farhank15/meerkat
