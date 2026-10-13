# Security Policy

## Supported versions

Meerkat is in active pre-release development. Only the latest `main` branch is
supported.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub's **private security advisory** flow:

1. Go to the **Security** tab of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue, the impact, and the steps to reproduce it.

We will acknowledge your report as soon as possible and keep you updated on the
fix. Please give us a reasonable window to remediate before any public
disclosure.

## Scope

**In scope:** the dashboard application, the CLI, and the GitHub Action defined
in this repository.

**Out of scope:** third-party services (TestSprite, Vercel, Neon, GitHub) — please
report issues there to their respective maintainers.

## Secrets

Never commit credentials. All secrets live in **GitHub repository secrets** and
**Vercel environment variables**, and local values go in `.env.local`, which is
git-ignored.

If you spot a leaked secret:

1. **Rotate it immediately** at the provider (invalidate the old value).
2. Update the GitHub secret / Vercel env var.
3. If it reached a commit, purge it from history and notify the maintainers.
