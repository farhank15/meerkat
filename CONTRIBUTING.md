# Contributing to Meerkat

Thanks for your interest in Meerkat! This project is being built for
[TestSprite Hackathon Season 4](https://www.testsprite.com/hackathon-s4) and is
currently in active development (pre-release).

## Ways to contribute

- **Report a bug** — open an issue using the *Bug report* template.
- **Request a feature** — open an issue using the *Feature request* template.
- **Submit a change** — open a pull request (see below).

## Development setup

**Requirements:** Node.js ≥ 20.19 (or 22.13 / 24+), npm.

```bash
git clone https://github.com/farhank15/meerkat && cd meerkat
npm install

npm run dev        # dashboard at http://localhost:3000
npm run test       # unit + property tests (Vitest + fast-check)
npm run typecheck
```

## Project layout

Meerkat is built with [TanStack Start](https://tanstack.com/start) (React +
TypeScript), deployed on Vercel with per-PR preview deployments, backed by
Postgres (Neon) + Drizzle ORM. Detailed architecture notes land as the build
progresses.

## Making a change

1. Fork the repository and create a branch:
   `git checkout -b feat/short-description`.
2. Keep **one concern per pull request** — no unrelated changes.
3. Make sure `npm run test` and `npm run typecheck` pass locally.
4. Open a pull request and fill in the template.

### Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     a new feature
fix:      a bug fix
docs:     documentation only
test:     tests only
refactor: neither a fix nor a feature
chore:    tooling, deps, build
```

## What happens on your pull request

Every pull request is verified automatically:

- **TestSprite** runs the end-to-end suite against **that PR's own preview
  deployment** (not production).
- **Meerkat** scores the suite (the *Test Strength Index*) and gates the merge
  against the `main` baseline.

A green check is the goal — but a **red-then-green** run that caught a real bug
is even better. That is the loop this project is about; see the
[README](README.md) for how it works.

## Code of conduct

By participating, you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
