# Meerkat — Runbook Hari-H (TestSprite Hackathon S4)

*Companion `PRD.md` v4.0 · 13 Okt 2026 (reframe v4: headline auto-remediation loop, potong fitur prior-art) · versi eksekusi step-by-step: `RUNBOOK.md` · status kesiapan & uji coba: `PREFLIGHT.md` · handoff agent: `AGENTS.md` · bukti trial 12 Okt: `TRIAL.md` · video: `VIDEO.md` · sumber: docs resmi TestSprite (GitHub integration, Environments, Plan Generation, Run Behavior, Test Runs & Reports), README `testsprite-action`, README `testsprite-cli`, halaman S4.*

**Tujuan dokumen ini:** pada 16 Okt kamu tidak mulai dari nol. Semua setup infra (repo, Vercel, TestSprite project, trigger GitHub) selesai sebelum window dibuka, sehingga 16–22 Okt 100% untuk build + loop PR.

---

## 1. Mekanisme: dari PR ke TSI ke loop

```
PR dibuka / push commit
      │
      ▼
Vercel membuat preview deployment → bot Vercel komen preview URL
      │
      ▼
TestSprite trigger (GitHub App) listen deployment_status → jalankan suite
      │      DI URL PREVIEW PR ITU (Environments placeholder, F21) → komen + status check
      ▼
suitevitals-action: parse JUnit + SPEC.md → hitung TSI (formula PRD §4)
      │      + step narrative dari `test failure get` bundle (F16)
      │
      ├─→ status check "SuiteVitals Ratchet" (baseline main vs TSI PR)
      ├─→ komentar PR (marker <!-- suitevitals -->) — edit in place
      ├─→ verdict audit (F18) + spec-drift (F19) → klasifikasi
      │        │
      │        ├─ refused / incomplete / drift → TIDAK menyentuh kode
      │        └─ regression + bundle → F20: agent baca bundle → commit fix → push → rerun → hijau
      │
      └─→ POST /api/runs → dashboard (run list, coverage, history, halaman Loop, share page)
```

**Fakta dari docs resmi yang menentukan arsitektur:**

- TestSprite **tidak build/deploy** — butuh preview deployment dari CI/CD kita (Vercel).
- `testsprite-action@v1` gagal job kalau ada test **skip** (default `allow-partial: false`) → suite kita jangan pernah menghasilkan skipped, atau set `allow-partial: true` dan catat di README.
- Fork PR tidak dapat secret → skip job (guard resmi di README action).
- CLI run unit = `test run --all` (whole-project); `--filter` substring saja.
- Credit: plan gratis **150/bulan**; ukur debit di PR 1–3.
- Failure bundle `test failure get --out` = input F16 + F20.

## 2. Setup one-time sebelum hari-H

Urutan eksekusi (perintah persis + fallback ada di `RUNBOOK.md` §1–4):

- [ ] **2.1** Discord S4 + role + follow X (15 m)
- [ ] **2.2** Akun TestSprite — satu email konsisten (5 m)
- [ ] **2.3** Repo scaffold: `npm create tanstack-start` → push stub ke `main` (1–2 j)
- [ ] **2.4** Vercel import → deploy prod → catat URL prod (30 m)
- [ ] **2.5** Portal: Connections → GitHub → "Only select repos" (15 m)
- [ ] **2.6** Buat project TestSprite — env default = URL prod (10 m)
- [ ] **2.7** Environments: `production` (URL prod) + `preview` (pattern `https://{proj}-git-{branch-slug}-team.vercel.app`) (30 m)
- [ ] **2.8** Auth: **Test Account Credentials** (bukan OTP/SSO) (10 m)
- [ ] **2.9** Trigger PR: Add Trigger → Pull Request → paste URL PR dummy → URL pattern → **Send Test Event** → lihat run jalan (45 m)
- [ ] **2.10** Dummy PR end-to-end: bot Vercel komen + testsprite-dev komen + status check (30 m)
- [ ] **2.11** Ukur debit credit PR pertama di portal (10 m)
- [ ] **2.12** **Validasi Meerkat sendiri:** `testsprite-action` jalan di repo percobaan → JUnit artifact ter-generate → `suitevitals score` CLI lokal membaca JUnit itu + SPEC fixture → angka sama dengan hitungan manual (30 m). *Gerbang versi kita.*
- [ ] **2.13** Draft `SPEC.md` aplikasi target di-commit (67 ID format `SV-XXX-NN`) sebelum plan generation.
- [ ] **2.14 E1 (blocker — coverage):** Jalankan 1 test dari portal → buka JUnit-nya → **apakah nama testcase memuat ID SPEC (`SV-XXX-NN`)?** Jika tidak: buat test via `test create --name "SV-SMK-01 …"` (kontrak nama ada di tangan kita).
- [ ] **2.15 E2 (blocker — narrative + loop):** Jalankan 1 test yang pasti gagal → `testsprite test failure get <id> --out ./bundle` → verifikasi bundle memuat failing step, assertion text, dan `snapshotId`. Ini input F16 **dan F20**.
- [ ] **2.16 E5 (blocker — loop dispatch):** Siapkan dispatch agent (mis. coding-agent CLI headless) yang menerima bundle → menghasilkan patch. Uji di repo percobaan: bundle → patch → commit. Kalau tidak jalan → F20 tetap ada tapi `action=manual` (loop manual), catat di README.
- [ ] **2.17 E6 (blocker — preview matrix):** Konfirmasi TestSprite meresolve placeholder preview URL per-PR (run PR benar-benar menembak URL preview, bukan prod). Kalau tidak → ENV turun jadi `environment` tunggal.
- [ ] **2.18 E4 (blocker — stability data):** Dalam satu workflow, jalankan `testsprite-action` dua kali untuk SHA sama (atau re-run job) → apakah JUnit kedua run tercatat dan bisa dipasangkan? Jika tidak, stability pakai history run per SHA (re-run manual, catat credit).

> **E3 (kill rate) dihapus di v4** — fitur itu dipotong (prior art). Lihat `INTEGRATION.md` §0/§3.

## 3. Test lists & trigger

- **Full suite di setiap PR** (draft included), **blocking ON setelah PR 3** — rubrik menilai *"the check fires on every PR"*.
- **Regression** = push ke `main`, non-blocking.
- **Stability data:** untuk skenario FLK-xx butuh ≥2 run SHA sama → re-run job via `workflow_dispatch` di PR penting (catat credit!).
- **Loop (F20)** hanya jalan di jalur PR dengan bundle lengkap — **tidak pernah** di push `main` biasa.

## 4. Plan generation — deskripsi bernilai pasti

Dari docs: *"The description is what drives generation."* Semua deskripsi plan diambil dari `SPEC.md` (96 skenario, tiap baris sudah ada angka eksak; generate inti dulu: SMK/CFG/ING/COV/TSI/RAT/PRM/VDT/DRF/FIX = 58). Contoh siap pakai:

```
Buka /runs — klik row pertama — run detail memuat 3 metrik:
TSI 93, coverage 0.895522, stability 0.985075.
Tabel coverage memuat 67 baris; baris SV-SMK-01 status "covered".
```

**First run → select ALL; run berikutnya → prune.** Exploration wajib hari-1: landing, login, run list, run detail, coverage table, halaman Loop, share page, tab Failures (narrative).

## 5. Urutan PR (urutan yang mengikat, bukan tanggal)

> **Satu concern = satu PR.** Bug nyata jangan dipalsukan; biarkan loop menangkap.

| PR | Fokus | Bukti selesai |
|---|---|---|
| #1 | Scaffold + landing + token desain + deploy + trigger aktif + **preview env (F21)** + CLI `score` stub (SMK + CFG + ENV) | check pertama fires di PR asli **di URL preview PR itu** |
| #2 | Parser JUnit + ingest API + akun/demo seed (ING + DSH) | JUnit → dashboard hidup |
| #3 | Coverage traceability + tabel detail + **spec drift** (DRF) + **blocking ON** (COV + RAT) | ratchet mulai memblokir |
| #4 | TSI formula + PR comment + **capture red→green PR** (TSI + PRM + FLK) | angka 93 ter-reproduce |
| #5 | **Verdict trust gate** (VDT) | refused/incomplete/drift terklasifikasi |
| #6 | Step narrative + **auto-remediation loop (FIX)** ← PR headline (NAR + FIX) | **loop menutup sendiri di PR asli** |
| #7 | Dashboard polish + halaman Loop + share page + CLI + ERR + feature freeze (CLI + ERR) | app quality bar ✓ |
| #8 | README papan skor + video + submit | **submit jauh sebelum 22 Okt 23:59 PT** |

**Urutan prioritas (kontrak SPEC "Scope", inti 58 dulu):**

1. **Inti (tidak boleh dipotong):** ingest → coverage + drift → TSI → ratchet → komentar PR → verdict audit (VDT) → **gate loop (FIX-02/03/04)** → kontrak nama `SV-`.
2. **Depth (dipotong sesuai urutan ini):** narrative (NAR) → halaman Loop/DSH → FLK → CLI → ENV → ERR.
3. **Stretch (baru setelah inti rapi):** command palette → virtualized table → CLI preview penuh.

Share page boleh terakhir. Demo story 60 detik: **PR turun → klasifikasi verdict → agent perbaiki → hijau** — rekam sekali, jangan remake.

## 6. Budget credit (free 150/bulan)

> **Aturan:** PR = full suite (rubrik "fires on every PR"). Fitur v4 lebih sedikit → kebutuhan turun vs v3.2.

| Pemakaian | Alokasi |
|---|---|
| PR #1 (plan generation + first full run + refine) | ~40 |
| PR #2–#8 (full suite per PR; suite tumbuh dari kecil) | ~8–20/PR ≈ 90 |
| Regression push main, 2–3× | ~15 |
| Rerun stability (FLK) | ~10 |
| **Total** | **~155** (di ambang) |

**Keputusan:** putuskan Starter $19 **hanya kalau debit terukur melebihi kuota** (bukan tebakan) — kemungkinan besar di PR #3. Alternatif tanpa bayar: full suite hanya PR yang menyentuh `src/**`, PR docs-only skip — **keputusan sadar, dicatat di README**.

## 7. Fix loop — yang harus terekam video

> Shot list, momen capture, dan naskah voice-over: [`VIDEO.md`](VIDEO.md).

```
Bug nyata tertangkap suite (contoh: rounding bug — 95.4999 harus 95, ke-96)
  → buka PR → check merah (testsprite-dev + suitevitals ratchet)
  → MEERKAT klasifikasi: regression (spec tidak berubah) + bundle lengkap
  → F20: agent baca bundle (failed at step 3/5, assertion, snapshot)
        → commit fix ke branch PR → push → deployment baru → run ulang otomatis
  → hijau → merge   (kalau refused/incomplete/drift: loop DIAM, tidak menyentuh kode)
```

**README papan skor** (isi saat build window): TSI history, jumlah run, bug tertangkap, loop (classification → action → result), coverage per PR — judges baca ini 20 detik pertama.

## 8. Submission

Checklist: repo publik + README (app, live URL, coverage) · ≥1 PR ber-check TestSprite · production live · email konsisten · video 60–90 detik ([`VIDEO.md`](VIDEO.md)). Deadline resmi: **22 Okt 23:59 PT = 23 Okt 13:59 WIB** — submit jauh sebelumnya.

Template Discord:

```
🦡 Submission TestSprite S4 — Meerkat
About: "Your suite is green. But is it *meaningful*?" — Meerkat menambah lapisan kepercayaan di atas verdict TestSprite, dan hanya menutup loop saat verdict-nya jujur.
Live: https://meerkat.vercel.app
Repo: https://github.com/<you>/meerkat
PR example (TestSprite check + ratchet + loop): https://github.com/<you>/meerkat/pull/<id>
Path: (#1 … #8; 96 scenarios, blocking merge, loop auto-remediation ber-gate, CLI bonus side-quest)
TestSprite email: <email>
Description: <2 kalimat: masalah test hijau-kosong + loop yang cuma bertindak saat verdict jujur>
```

## 9. Sumber resmi

- [testsprite-action](https://github.com/TestSprite/testsprite-action) — run unit, outputs, JUnit, allow-partial, fork guard
- [GitHub Integration](https://docs.testsprite.com/web-portal/integrations/github-integration) — trigger, URL pattern, blocking
- [Environments](https://docs.testsprite.com/web-portal/setup/environments.md) — placeholder per-run resolve (F21)
- [Plan Generation](https://docs.testsprite.com/web-portal/core/ui/ui-plan-gen) — description drives generation, select-all first run
- [Run Behavior](https://docs.testsprite.com/web-portal/setup/execution-settings.md) — viewport/concurrency/credit
- [Test Runs & Reports](https://docs.testsprite.com/web-portal/results/test-report.md) — Fix prompt, failure bundle
- [S4](https://www.testsprite.com/hackathon-s4) — rubric & submission format
- Eksekusi: [`RUNBOOK.md`](RUNBOOK.md) · Video: [`VIDEO.md`](VIDEO.md) · Skenario: [`SPEC.md`](SPEC.md) · Diferensiasi: [`INTEGRATION.md`](INTEGRATION.md)

## 10. Side-quest CLI bonus $1.000 (16–29 Okt — terpisah dari $3.000 proyek)

Mekanik resmi (diverifikasi 12 Okt): entry via **checkbox di PR template + bot konfirmasi**; klaim issue di `TestSprite/testsprite-cli` via komentar, maks **3** klaim, **48 jam** tanpa aktivitas = warning, **72 jam** = dilepas, PR harus menutup issue (`Fixes #N`) + memuat test, bot konfirmasi eligibility, maks 3 PR eligible, PR harus open & out-of-draft **sebelum 29 Okt**.

| Kapan | Apa |
|---|---|
| **Saat window dibuka, menit pertama** | Cek status klaim; klaim 1–2 issue berbobot — preferensi: **#375** (flaky refusal di-skor failure), **#378** (diff membandingkan run tanpa verdict), fallback **#369/#365** (lebar kolom CJK) |
| Selama window | Hanya komentar + draft jika ada waktu luang — fokus utama tetap proyek |
| **Setelah submit proyek** | Bangun PR dengan test lengkap; perbarui klaim tiap <48 jam |
| Buffer sebelum 29 Okt | Review + pastikan PR open & out-of-draft sebelum 29 Okt 23:59 PT |

**Jangan disentuh:** #358 (split modul 17k baris), #359 (parallel execution) — scope kebablasan.

Syarat menang: judges nilai *Impact · Problem Definition · Craft · Discipline*. *"Agents screen, a human decides."*
