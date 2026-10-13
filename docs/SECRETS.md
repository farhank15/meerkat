# SECRETS — Kredensial & konfigurasi (checklist)

> **File ini cuma berisi NAMA secret + cara set + cara verifikasi. JANGAN pernah tulis nilai aslinya di sini, di repo, atau di chat.**
> Nilai asli = tugas manusia. Kalau agent butuh nilainya → **tanya manusia** (AGENTS aturan #6).
>
> Pendamping: [`RUNBOOK.md`](RUNBOOK.md) A5 (langkah setup) · [`PREFLIGHT.md`](PREFLIGHT.md) §1 (status).

---

## 1 · GitHub repo secrets (5)

Set di repo `meerkat`, **bukan** di Environments (secret di *Environments* tidak terbaca workflow tanpa `environment:` — gotcha trial #2).

| Nama | Untuk apa | Dipakai di | Cara set |
|---|---|---|---|
| `TESTSPRITE_API_KEY` | `testsprite-action` jalan di tiap PR | `.github/workflows/testsprite.yml` | `gh secret set TESTSPRITE_API_KEY` |
| `SUITEVITALS_API_KEY` | Action Meerkat kirim run ke dashboard (`POST /api/runs`) | workflow Meerkat + API header | `gh secret set SUITEVITALS_API_KEY` |
| `AGENT_API_KEY` | **F20** dispatch agent fix (mis. `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) | job loop (bukan PR biasa) | `gh secret set AGENT_API_KEY` |
| `DATABASE_URL` | dashboard simpan run (Postgres/Neon) | Vercel env **dan** workflow (kalau perlu) | `gh secret set DATABASE_URL` |
| `GITHUB_TOKEN` | **F20** push fix commit + komentar PR | otomatis dari Actions | **tidak diset manual** — pakai `permissions:` di workflow (lihat §3) |

**Verifikasi:**

```bash
gh secret list          # harus muncul 4 nama di atas (GITHUB_TOKEN otomatis, tidak ikut terdaftar)
```

---

## 2 · Kredensial non-secret (diisi di UI, bukan di repo)

| Kredensial | Di mana | Dipakai untuk |
|---|---|---|
| Akun TestSprite (email + password) | Portal → project → **Test Account Credentials** (Fase B-4) | test login E2E; **email harus = email submission** |
| Akun demo app | `demo@suitevitals.dev` / `demo-password-1` | login dashboard di suite |
| Akun GitHub | sudah login CLI (`gh auth status`) | push, PR, secret |
| Akun Vercel | sudah login CLI (`vercel login`) | deploy prod + preview per-PR |
| Akun Neon | dashboard Neon | ambil `DATABASE_URL` |
| Akun Discord | join server S4 + role | klaim issue CLI, submit |
| Akun X | follow @TestSprite | syarat ikut (step 1 halaman S4) |

---

## 3 · Vercel environment variables

Set di project Vercel (Production + Preview):

```bash
vercel env add DATABASE_URL        # nilai dari Neon
vercel env add SUITEVITALS_API_KEY # kalau dashboard server-side butuh
vercel env ls                      # verifikasi
```

**Lokal:** taruh di `.env.local` (WAJIB masuk `.gitignore` — jangan pernah di-commit).

```bash
# .env.local (contoh NAMA saja, isi nilainya sendiri)
DATABASE_URL=postgres://...
SUITEVITALS_API_KEY=...
```

---

## 4 · Permissions workflow (khusus F20 — loop auto-remediation)

Supaya agent bisa push fix commit + komentar PR, workflow butuh izin eksplisit:

```yaml
permissions:
  contents: write        # push fix commit ke branch PR
  pull-requests: write   # komentar PR
```

`GITHUB_TOKEN` disediakan otomatis oleh Actions — **jangan** diset manual sebagai secret.

> **Batas:** loop hanya boleh push ke **branch PR yang sama** (bukan `main`), dan **tidak pernah** mengubah test/SPEC (FIX-08).

---

## 5 · Aturan (jangan dilanggar)

1. **Jangan commit nilai secret** — cek `.gitignore` memuat `.env*` sebelum push pertama.
2. **Repository secret**, bukan Environments secret (kecuali workflow pakai `environment:`).
3. **Set via `gh secret set`** (input hidden) — jangan lewat `echo`/file/chat.
4. **Jangan share API key di chat/PR/commit message.**
5. Cek frame video sebelum upload — jangan sampai token kebaca (VIDEO.md).
6. Kalau ada secret bocor: **rotate** (bikin baru di portal → `gh secret set` lagi) → hapus yang lama.

---

## 6 · Checklist verifikasi (sebelum window buka)

- [ ] `gh auth status` → login sebagai akun yang benar
- [ ] `gh secret list` → 4 secret manual muncul (`TESTSPRITE_API_KEY`, `SUITEVITALS_API_KEY`, `AGENT_API_KEY`, `DATABASE_URL`)
- [ ] `vercel env ls` → `DATABASE_URL` ada di Production + Preview
- [ ] `.gitignore` memuat `.env*`
- [ ] Email akun TestSprite **= email submission** (sama persis)
- [ ] Test Account Credentials terisi di portal (bukan OTP/SSO)
- [ ] Workflow punya `permissions: contents: write, pull-requests: write` (untuk F20)
