# RUNBOOK — Eksekusi 16–22 Okt (zero-thinking)

> **File ini = versi eksekusi** dari [`HARI-H.md`](HARI-H.md) (strategi & alasan). Ikuti dari atas, jangan lompat. Tiap langkah punya: perintah persis, tanda "selesai", dan fallback kalau gagal.
>
> **Urutan yang benar (jawaban "live dulu atau fitur dulu?"): LIVE DULU → WIRE DULU → BARU FITUR, per PR.**
> Alasan resmi dari halaman S4: tests jalan against your live app — *"localhost doesn't count"*, *"Deploy early, keep it live the whole build"*, dan *"The PR check runs this suite, so it has to exist first"*. Fitur tanpa live URL = check tidak bisa jalan = bukti PR tidak ada.

---

## Peta alur hari-H (satu layar — baca ini dulu)

```
SETUP — sekali, sebelum loop PR (target ~5 jam)
  §0  Cek halaman S4 + Discord + klaim issue CLI ......................... 15 m
  §1  Fase A: git init → scaffold → commit → push main → deploy prod .... 90 m
      └─► INI "initial push": main = dokumen + scaffold kosong
          (belum ada fitur; hanya fondasi + live URL)
  §2  Fase B: wiring TestSprite di portal (repo, project, env, trigger) .. 60 m
  §3  Fase C: eksperimen E1/E2/E4/E5/E6 ................................ 120 m
  §4  Fase D: gerbang pipeline JUnit (workflow → artifact → score) ...... 30 m

LOOP PR — ulang 8×, satu concern = satu PR
  §5  pola tiap PR: branch → bangun → test lokal → push → PR → 2 check
      → HIJAU (merge) atau MERAH (klasifikasi loop → fix/diam)
  §6  urutan: #1 → #2 → #3 → #4 → #5 → #6 → #7 → #8
      (#6 = PR headline: auto-remediation loop)

SUBMIT
  §8  PR link + live URL + email akun → Discord #hackathon-submissions
```

**Yang di-push kapan:**
| Momen | Isi push | Ke mana |
|---|---|---|
| A2 (initial) | dokumen + scaffold kosong | `main` langsung (belum ada PR) |
| PR #1..#8 | satu fitur per PR | branch → PR → `main` setelah hijau |

---

## 0 · Cek dulu sebelum sentuh apa pun (15 menit)

> Status kesiapan akun/infra + rencana uji coba di [`PREFLIGHT.md`](PREFLIGHT.md). **Bukti trial 12 Okt** ada di [`TRIAL.md`](TRIAL.md).

- [ ] Buka [halaman S4](https://www.testsprite.com/hackathon-s4) → pastikan jadwal masih **"Oct 16 · Season Opens"** (*"final schedule confirmed in Discord"*).
- [ ] Discord `#hackathon-announcements` → baca semua post baru sejak 12 Okt.
- [ ] Discord `#hackathon-qa` → cek jawaban 4 pertanyaan kita (kode pra-window, suite pra-window, reset credit, eligibility pemenang lalu). **Belum ada jawaban → tanya lagi, jangan berangkat nebak.**
- [ ] **Menit pertama 16 Okt — klaim issue CLI:** komentar "claiming" + Discord username di **#375** (preferred) atau **#378**. Cek dulu masih *Open + No one assigned*. Fallback **#369/#365**. Kalau semua keambil → lewati CLI sampai 23 Okt (lihat HARI-H §10).
- [ ] Catat jam klaim → jam 48 (warning) dan 72 (lepas) ada di kalender.
- [ ] Konfirmasi: email akun TestSprite **sama persis** dengan email yang submit.

> Fase 1–4 di bawah idealnya jalan **sebelum hari-H** *jika* Discord mengizinkan pra-window. Kalau tidak → jalankan di awal window **sebelum** bagian 2 (loop PR).

---

## 1 · Setup one-time — Fase A: repo & LIVE (target 90 menit)

> Repo ini sudah berisi dokumen (PRD/SPEC/HARI-H/README) — scaffold **di-merge**, jangan ditimpa.

```bash
# A1 · scaffold ke folder sementara, merge ke repo ini (README & .git JANGAN ditimpa)
npm create tanstack-start@latest tmp-scaffold
#   → pilih default: TypeScript, Tailwind, no Docker
rsync -a --exclude .git --exclude README.md tmp-scaffold/ ./
rm -rf tmp-scaffold
npm install
npm run dev                        # → http://localhost:3000, landing hidup

# A2 · init + push ke GitHub (repo WAJIB publik — syarat submission)
git init                                   # repo ini belum git (kalau sudah, skip)
git add -A
git commit -m "chore: scaffold TanStack Start + docs"
gh repo create meerkat --public --source . --push    # bikin repo + push sekaligus
#   alternatif manual: git remote add origin git@github.com:<you>/meerkat.git && git push -u origin main

# A3 · deploy produksi
npx vercel link --yes
npx vercel --prod                  # → catat URL produksi (https://meerkat.vercel.app)

# A4 · smoke test live
open https://meerkat.vercel.app   # dari JARINGAN BUKAN localhost, idealnya juga dari HP
```

### A5 · Secrets & kredensial (yang harus disiapkan — nilai asli: **tanya manusia**)

> Checklist lengkap + cara verifikasi: [`SECRETS.md`](SECRETS.md).

| Secret | Untuk apa | Di mana diset |
|---|---|---|
| `TESTSPRITE_API_KEY` | `testsprite-action` jalan di tiap PR | GitHub **repo** secret → `gh secret set TESTSPRITE_API_KEY` |
| `SUITEVITALS_API_KEY` | Action Meerkat kirim run ke dashboard | GitHub repo secret |
| `DATABASE_URL` | dashboard simpan run (Neon) | Vercel env + `.env` lokal |
| `AGENT_API_KEY` | **F20** dispatch agent fix (mis. `ANTHROPIC_API_KEY`) | GitHub repo secret — **hanya jalur loop**, bukan PR biasa |
| `GITHUB_TOKEN` | **F20** push fix commit + komentar PR | otomatis (Actions) — butuh `permissions: contents: write, pull-requests: write` |

**Bukan secret repo (diisi di UI):** akun TestSprite (email/password) → **Test Account Credentials** portal (Fase B-4); akun demo app `demo@suitevitals.dev` / `demo-password-1`.

> **Aturan:** jangan pernah tulis nilai secret di file repo atau chat. Set via `gh secret set` (input hidden) atau Vercel dashboard. **Secret harus Repository secret** — secret di *Environments* tidak terbaca workflow tanpa `environment:` (gotcha trial #2). Kalau agent butuh nilainya → **tanya manusia** (AGENTS aturan #6).

**Selesai =** landing terbuka di prod + sudah ke-push ke GitHub publik + 5 secret terpasang.
**Gagal →** (a) `npm create` gagal → ikuti docs resmi tanstack.com/start, scaffold manual; (b) Vercel gagal → deploy via dashboard (Import Git Repo).

---

## 2 · Fase B: wiring TestSprite di portal (target 60 menit)

Eksekusi di UI (detail: HARI-H §2.5–2.11):

1. [ ] Portal → **Connections → GitHub → "Only select repos"** → pilih repo.
2. [ ] Buat **project** — env default = URL prod (dari A3).
3. [ ] **Environments**: `production` (URL prod) + `preview` (pattern `https://{proj}-git-{branch-slug}-team.vercel.app`) — **ini yang bikin tiap PR dites di preview-nya sendiri (F21)**.
4. [ ] **Auth: Test Account Credentials** (bukan OTP/SSO) — dibutuhkan test login.
5. [ ] **Add Trigger → Pull Request** → paste URL PR dummy → URL pattern → **Send Test Event**.
6. [ ] **Dummy PR end-to-end** → tiga tanda berhasil: (a) Vercel kirim komen preview, (b) `testsprite-dev` komen, (c) status check muncul.
7. [ ] Catat **debit credit** run pertama di portal (baseline budget — HARI-H §6).
8. [ ] **Branch protection (biar ratchet beneran nge-block):** GitHub → Settings → Branches → Add rule untuk `main` → centang **Require status checks to pass** → pilih `testsprite-dev` + `SuiteVitals Ratchet`. Tanpa ini, "blocking" cuma kosmetik.

**Selesai =** 1 run TestSprite tercatat + credit debit tercatat + branch protection aktif.

---

## 3 · Fase C: 5 eksperimen blocker (target 120 menit) — HARI-H §2.14–2.18

> E1–E2 sebagian bisa dijawab dari README `testsprite-action` + docs **tanpa run**. E5–E6 wajib run.

| E | Pertanyaan | Kalau LOLOS | Kalau GAGAL |
|---|---|---|---|
| **E1** | Nama testcase di JUnit memuat ID SPEC (`SV-XXX-NN`)? | coverage-by-ID jalan | buat test via `test create --name "SV-SMK-01 …"` → kontrak nama di tangan kita |
| **E2** | `test failure get --out` memuat failing step + assertion + `snapshotId`? | F16 + F20 pakai field asli | catat field yang ada → F16 disesuaikan; fallback = parse JUnit |
| **E5** | Bundle → coding-agent CLI headless → patch → commit bisa jalan? | **F20 dispatch otomatis (headline penuh)** | F20 tetap ada tapi `action=manual` (loop manual); catat di README |
| **E6** | TestSprite meresolve placeholder preview URL per-PR (menembak preview, bukan prod)? | **F21 preview matrix penuh** | ENV turun jadi `environment` tunggal; catat |
| **E4** | Dua run SHA sama bisa dipasangkan? | stability dari pasangan itu | stability = re-run manual per SHA (catat credit) |

> E1 sudah terjawab di trial 12 Okt (nama polos → kontrak `test create --name`; lihat [`TRIAL.md`](TRIAL.md)). **E3 (kill rate) dihapus di v4** — fitur dipotong.

**E5 = keputusan besar.** Kalau dispatch agent tidak bisa diandalkan, loop tetap berharga (klasifikasi + narrative + loop manual), tapi headline bergeser ke verdict-trust. Ambil keputusan saat itu, jangan ditunda.

---

## 4 · Fase D: gerbang pipeline JUnit (target 30 menit — HARI-H §2.12)

```yaml
# .github/workflows/testsprite.yml — gerbang teknis Meerkat
name: TestSprite
on:
  push: { branches: [main] }
  pull_request:
jobs:
  e2e:
    runs-on: ubuntu-latest
    # fork PR tanpa secrets → skip (guard resmi dari README testsprite-action)
    if: ${{ github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository }}
    steps:
      - uses: TestSprite/testsprite-action@v1
        with:
          api-key: ${{ secrets.TESTSPRITE_API_KEY }}
          project: "<project-id>"
      # artifact: testsprite-junit (JUnit XML) → dibaca CLI suitevitals
      # F21: run di URL preview PR (Environments placeholder) — bukan prod
```

- [ ] Jalankan → artifact `testsprite-junit` ter-generate.
- [ ] `npx suitevitals score --junit testsprite-junit.xml --spec SPEC.md` → **angka sama persis** dengan hitungan manual.

**Selesai =** pipeline JUnit → score terbukti jalan. **Gagal sebelum hari-H → perbaiki sebelum window dibuka.** Gagal di dalam window → jalur JUnit-only untuk gating.

> Gerbang JUnit terbukti parsial di trial 12 Okt (artifact keluar, CLI menunggu dibangun; lihat [`TRIAL.md`](TRIAL.md)). Cross-check byte-identik wajib sebelum klaim selesai.

---

## 5 · Loop per PR — pola sama tiap PR (bagian yang nggak usah mikir lagi)

**Satu concern = satu PR. Urutannya selalu begini, dari PR #1 sampai #8:**

```
 git checkout -b pr-N-<fitur>
        │
        ▼
 [1] Bangun fitur + skenario keluarga (tabel §6) ── tambahkan ID ke SPEC.md + fixture angka
        │
        ▼
 [2] Lokal hijau dulu:  npm run test  &&  npm run typecheck     ← WAJIB sebelum push
        │
        ▼
 [3] git push -u origin pr-N-<fitur>  → Vercel bikin PREVIEW deployment (tunggu "Preview" ready)
        │
        ▼
 [4] gh pr create → PR ke main, body memuat ID skenario + angka eksaknya
        │
        ▼
 [5] DUA check harus muncul sendiri:
       • testsprite-dev  (suite E2E, full run DI PREVIEW URL PR INI — F21)
       • suitevitals / ratchet (score + baseline)
        │
        ├── [6a] HIJAU  → cek coverage naik sesuai keluarga → gh pr merge → main hijau
        │
        └── [6b] MERAH  → MEERKAT KLASIFIKASI (F18/F19):
              • refused / incomplete / spec-drift → LOOP DIAM (tidak menyentuh kode)
              • regression + bundle → F20: agent baca bundle → commit fix → push → rerun → hijau
                (agent gagal 1× → escalate ke manusia; jangan retry tanpa batas)
        │
        ▼
 [7] Catat debit credit (portal) → rekam footage penting SEKALI (§7 VIDEO.md) → PR berikutnya
```

**Branch & konvensi (yang bikin rapi):**

- `main` = branch produksi + baseline ratchet. **Jangan push fitur langsung ke `main`.**
- Tiap PR: `git checkout -b pr-N-<fitur>` dari `main` (mis. `pr-6-auto-remediation`).
- PR ke `main` → Vercel auto-bikin **preview** per branch → TestSprite pattern cocokin `{branch-slug}`.
- Setelah hijau: `gh pr merge --squash` → `main` update → baseline TSI ke-update.
- **F20 (loop) push fix ke branch PR yang sama**, bukan ke `main`.

**Aturan yang sering bikin salah:**

- **Gate PR = full suite** (`--all`) di setiap push (kontrak rubrik "fires on every PR").
- **Loop tidak pernah memalsukan kegagalan** dan **tidak pernah mengubah test/SPEC** — hanya kode aplikasi.
- **Preview harus ready dulu** sebelum TestSprite run (pattern env di Fase B-3).
- **PR jangan di-draft-kan terlalu lama** — check harus kebaca juri dari PR.

**Definition of Done setiap PR:**

- [ ] `npm run test` + `npm run typecheck` hijau lokal
- [ ] skenario keluarga ditambah di `SPEC.md` + fixture angka ikut berubah
- [ ] testsprite check **fires** (bukan skipped) di preview URL PR, dan akhirnya hijau
- [ ] ratchet check muncul & hijau; coverage table naik sesuai harapan
- [ ] kalau ada kegagalan: klasifikasi loop benar (diam untuk refused/incomplete/drift)
- [ ] debit credit dicatat; footage momen penting direkam (sekali saja)
- [ ] merge → baseline TSI ke-update di main

---

## 6 · Urutan PR (urutan #1→#8 yang mengikat, bukan tanggal; detail & alasan di HARI-H §5)

| PR | Fokus | DoD utama |
|---|---|---|
| #1 | Landing + token desain + deploy + trigger aktif + **preview env (F21)** + CLI `score` stub (SMK + CFG + ENV) | check pertama fires di PR asli, di URL preview PR itu |
| #2 | Parser JUnit + ingest API + akun/demo seed (ING + DSH) | JUnit → dashboard hidup |
| #3 | Coverage traceability + tabel detail + spec drift + **blocking ON** (COV + DRF + RAT) | **ratchet mulai memblokir** |
| #4 | TSI formula + PR comment + rekam PR merah→hijau (TSI + PRM + FLK) | angka 93 ter-reproduce |
| #5 | Verdict trust gate (VDT) | refused/incomplete/drift terklasifikasi di comment |
| #6 | Step narrative + **auto-remediation loop** (NAR + FIX) ← **PR headline** | **loop menutup sendiri di PR asli** |
| #7 | Dashboard polish + halaman Loop + share page + CLI + ERR + feature freeze (CLI + ERR) | app quality bar ✓ |
| #8 | README papan skor + video + submit | **submit jauh sebelum 22 Okt 23:59 PT** |

**Urutan potong kalau kepepet (kontrak SPEC "Scope"):** inti 58 (SMK/CFG/ING/COV/TSI/RAT/PRM/VDT/DRF/FIX) → depth (NAR → FLK → DSH → CLI → ENV → ERR) → stretch (palette, virtualized table). Share page boleh terakhir.

---

## 7 · Kalau terjepit — tabel keputusan

| Simptom | Keputusan |
|---|---|
| Credit tinggal < 40 di pertengahan minggu | putuskan **Starter $19** (angka terukur) — atau full-suite hanya PR yang menyentuh `src/**` (keputusan sadar, dicatat di README) |
| E5 gagal (agent dispatch tak bisa diandalkan) | F20 turun jadi loop **manual** (`action=manual`); headline bergeser ke verdict-trust + preview matrix |
| E6 gagal (preview tidak bisa per-PR) | ENV jadi `environment` tunggal; tetap catat prod vs preview |
| Gerbang §4 gagal di dalam window | fallback JUnit-only untuk gating |
| Jam kerja habis sebelum DoD | potong sesuai urutan §6 — **jangan** potong "check fires on every PR" |
| Semua issue CLI keambil | lewati CLI, fokus proyek (HARI-H §10) |

---

## 8 · Submission

Deadline resmi: **22 Okt 23:59 PT = 23 Okt 13:59 WIB**. Submit jauh sebelum deadline.

- [ ] Repo publik + README berisi app, **live URL**, coverage (README sudah disiapkan — tinggal isi link PR & video yang kosong).
- [ ] ≥1 PR membawa check TestSprite (paling bagus = PR yang dulu merah lalu hijau **lewat loop**).
- [ ] Production **live** sejak awal window (jangan dimatikan).
- [ ] Video 60–90 detik → link di Discord ([`VIDEO.md`](VIDEO.md)).
- [ ] Posting di Discord `#hackathon-submissions`: PR link + live URL + email akun (template: HARI-H §8).

---

## 9 · Sumber resmi

- [S4 — halaman resmi](https://www.testsprite.com/hackathon-s4) (rubrik, timeline, submission)
- [`testsprite-action`](https://github.com/TestSprite/testsprite-action) (workflow YAML §4)
- [`testsprite-cli`](https://github.com/TestSprite/testsprite-cli) (CLI bonus — HARI-H §10)
- Docs TestSprite — daftar lengkap: HARI-H §9
