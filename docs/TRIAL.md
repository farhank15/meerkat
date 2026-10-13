# TRIAL — Bukti trial mekanik 12 Okt 2026 (repo latihan, sudah dihapus)

> **Anotasi v4 (13 Okt):** trial ini dilakukan saat masih v3.2. Reframe v4 memotong **E3 (kill rate)** — eksperimen itu **tidak lagi relevan** dan dihapus dari `RUNBOOK.md` §3. E1 tetap terjawab dan masih berlaku; E2/E4 masih dipakai; **E5 (dispatch agent F20)** dan **E6 (preview env F21)** adalah eksperimen baru yang belum pernah dicoba. Bukti historis di bawah dibiarkan apa adanya (jangan diedit agar terlihat lebih bagus).

> Trial ini memakai repo latihan `farhank15/test1` + app stub Vite kosong (bukan Meerkat).
> Repo trial **sudah dihapus** dari GitHub; repo ini sudah dibersihkan untuk hari-H.
> Nilai trial: mekanik terverifikasi, E1 terjawab, budget terukur, gotcha tercatat.
> Angka di bawah = angka asli saat itu, bukan salinan dokumen.

## 1 · Hasil Kategori A (6/6)

| # | Hasil |
|---|---|
| A1 | ✅ `create-tanstack-start` interaktif-only (gagal di shell non-TTY: `ERR_USE_AFTER_CLOSE`) → fallback RUNBOOK: `npm create vite@latest -- --template react-ts` di `testing/sandbox/`. `npm install` OK (0 vuln). `npm run dev :3000` → HTTP 200 |
| A2 | ✅ `gh auth status` = farhank15 → `git init` → push `main` OK |
| A3 | ✅ Vercel CLI 63.1.2, login OK. Prod `https://sandbox-tau-eight.vercel.app` HTTP 200. Preview per-PR Ready |
| A4 | ✅ Node `v26.5.0` (≥ syarat), npm 11.17.0 |
| A5 | ✅ `testsprite-cli` versi `0.14.0` |
| A6 | ✅ `.github/workflows/testsprite.yml` valid. Run pertama gagal `AUTH_REQUIRED` (tepat seperti harapan, secret belum diisi). Setelah secret + project-id diisi → run 4 mnt → artifact `testsprite-junit` keluar (32t: 24 pass / 8 fail / 0 skip) |

## 2 · E1 TERJAWAB — ❌ (jalur fallback berlaku)

32 testcase bernama deskripsi Inggris polos (`"Open Resources menu and navigate to Blog"`), `classname` = project-ID. **Tidak satu pun memuat `SV-XXX-NN`.**
Keputusan: test suite Meerkat wajib dibuat via `test create --name "SV-XXX-NN …"` (kontrak nama di tangan kita; prefix `SV-` dipertahankan walau nama produk Meerkat). E2/E4–E6 belum dikerjakan (tunggu window); **E3 dihapus di v4** (kill rate dipotong).

## 3 · Gerbang pipeline — parsial ✅

Action → JUnit terbukti (parse manual OK: total=32, pass_rate=24/32=0.75). CLI `suitevitals score` + cross-check byte-identik menunggu produk dibangun di window.

## 4 · Debit credit

Trial 1 hari (create project + test event + 1 full run 32 test) = **54/150, sisa 96**. Window butuh ~170 → Free tidak cukup → putuskan **1 Month Free Trial** (tombol di Billing, cek syarat) atau **Starter $19** pada 16 Okt. Stop run trial sampai window.

## 5 · Paywall (temuan terbesar)

- **Route B (GitHub Actions) jalan di Free** selama credit ada — sah sebagai TestChecker (*"either counts"*).
- **Route A (GitHub App trigger / Send Test Event) diblokir Free** — butuh Starter/trial untuk komen `testsprite-dev` otomatis.
- Implikasi: Starter/trial = soal **kuota credit**, bukan soal route.

## 6 · Gotcha (jangan ulangi di window)

1. Vercel Root Directory dengan **spasi di ujung** (`"testing/sandbox "`) → build 0ms lalu Error. Selalu tanpa spasi.
2. Secret harus **Repository secret** (Settings → Secrets and variables → Actions). Secret di **Environments** tidak terbaca workflow tanpa `environment:` di job.
3. `create-tanstack-start` butuh TTY interaktif — di shell agent pakai fallback Vite atau scaffold manual.
4. Vercel CLI warning `EBADENGINE` (minta Node ^20/^22/^24, kita v26.5) — deploy tetap jalan, tapi waspadai error aneh.
5. Workflow trial butuh event yang cocok: push branch biasa tidak trigger (`push: [main]` + `pull_request` saja) — verifikasi via PR.
6. Masukkan email final TestSuite = email submission **sebelum 16 Okt**. Ganti akun = ulang secret + project-id + generate suite.
7. Jangan share API key di chat — via `gh secret set` (input hidden).
