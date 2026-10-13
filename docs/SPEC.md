# SPEC.md — 96 Skenario Meerkat (nilai pasti)

*Versi 4.0 · 13 Okt 2026 · sumber: `PRD.md` §3 · file ini di-upload ke portal TestSprite sebagai PRD detail saat membuat suite.*

> **Reframe v4.0 (13 Okt):** keluarga **ATT, RPL, KIL, IMP dipotong** (prior art / di luar fokus rubrik — lihat `INTEGRATION.md` §0). Dua keluarga baru: **FIX** (auto-remediation, headline) dan **ENV** (preview matrix). DSH bertambah satu skenario (halaman Loop).

## Cara pakai

1. **Upload bersama `PRD.md`** (PRD = konteks, file ini = skenario bernilai pasti).
2. **First run: select ALL**; run berikutnya prune per PR (hemat credit).
3. Kontrak: **setiap skenario minimal satu angka/label eksak**. Tanpa nilai = skenario tidak valid.
4. ID skenario di SPEC ini (`SMK-01` … `ERR-04`) juga dipakai sebagai **contoh format ID** yang harus ada di `SPEC.md` aplikasi target — jangan tertukar: ID di bawah = skenario menguji Meerkat; suite Meerkat sendiri memakai prefix `SV-` (identifier stabil, tidak ikut rename).

## Rumus TSI (satu-satunya sumber, dari PRD §4)

```
coverage   = covered_ids / total_ids
stability  = 1 − conflicted/tested      (run < 2 → 1.0, label estimated)
pass_rate  = passed / total
TSI        = round(100 × (0.50×coverage + 0.30×stability + 0.20×pass_rate))
```

## Traceability

| Keluarga | # | PR asal |
|---|---|---|
| SMK | 4 | #1 |
| CFG | 6 | #1 |
| ENV | 4 | #1 |
| ING | 6 | #2 |
| DSH | 8 | #2 |
| COV | 9 | #3 |
| DRF | 3 | #3 |
| RAT | 6 | #3 |
| TSI | 8 | #4 |
| PRM | 5 | #4 |
| FLK | 6 | #4 |
| VDT | 3 | #5 |
| NAR | 10 | #6 |
| FIX | 8 | #6 |
| CLI | 6 | #7 |
| ERR | 4 | #7 |
| **Total** | **96** | |

## Scope — inti vs extended (aturan potong)

**Inti (58, wajib hijau sebelum freeze):** SMK 4 + CFG 6 + ING 6 + COV 9 + TSI 8 + RAT 6 + PRM 5 + VDT 3 + DRF 3 + **FIX 8**. Ini = pilar 2 (wiring) + pilar 3 (loop): submission aman + diferensiasi.
**Extended (38, tambah jika waktu ada, urutan):** NAR 10 → FLK 6 → DSH 8 → CLI 6 → ENV 4 → ERR 4.
**Tidak boleh dipotong:** check fires on every PR (RAT-06), verdict audit (VDT), kontrak nama `SV-` (ING-06/COV-04), **gate loop (FIX-02/03/04)**.

---

## SMK — Smoke (4)

- **SMK-01 — Landing.** Buka `/`. Expect: kartu skor demo (TSI `93`) tampil, tombol `Lihat run pertama` ada, tanpa login.
- **SMK-02 — API health.** `GET /api/health`. Expect: `200` dengan body `{"status":"ok"}`.
- **SMK-03 — CLI hello.** Jalankan `suitevitals --version`. Expect: output `suitevitals 0.1.0`, exit code `0`.
- **SMK-04 — Share page.** Buka `/s/demo`. Expect: kartu skor publik dengan TSI `93`, tanpa login.

## CFG — Konfigurasi Action (6)

- **CFG-01 — Default paths.** Workflow tanpa `spec-path`/`junit-path`. Expect: Action memakai `SPEC.md` dan `testsprite-junit.xml` (terbukti dari run yang tercatat `status=complete`).
- **CFG-02 — Custom paths.** `spec-path: docs/TESTSPEC.md`. Expect: ID diambil dari file itu (coverage terhadap 70 ID di file tersebut).
- **CFG-03 — API key hilang.** Workflow tanpa `api-key`. Expect: Action exit code ≠ 0, log memuat `SuiteVitals: API key missing`, tidak ada run terkirim.
- **CFG-04 — Spec path salah.** `spec-path: nope.md`. Expect: status run `warning`, TSI dihitung dengan mode spec kosong (renormalisasi bobot, lihat COV-08).
- **CFG-05 — JUnit path salah.** `junit-path: nope.xml`. Expect: run `status=missing-artifact`, komentar PR berisi TSI `null` + alasan.
- **CFG-06 — Draft PR.** Buka draft PR. Expect: check + komentar terpasang (Include Draft PRs ON).

## ENV — Preview Environment Matrix (4, PRD F21)

- **ENV-01 — Environment preview vs production.** Run PR mencatat `environment=preview` + `resolved_url` (`https://meerkat-git-pr-12-team.vercel.app`); run push `main` mencatat `environment=production`. Expect: dashboard membedakan keduanya (kolom `env`); TSI dihitung sama dari masing-masing run.
- **ENV-02 — Matrix konteks.** Satu PR dijalankan 3 konteks (`desktop-auth`, `mobile-auth`, `desktop-anon`). Expect: 3 baris di bawah satu "PR group", kolom `context` terisi tepat 3 nilai itu.
- **ENV-03 — Agregasi + detail.** TSI PR group dari konteks primer (`desktop-auth`); kolom `contexts` = `3/3`. Run detail menampilkan `environment`, `context`, dan URL persis yang dites. Expect: `contexts 3/3` tampil; URL = `https://meerkat-git-pr-12-team.vercel.app`.
- **ENV-04 — Env tidak siap.** Preview belum ready saat run diminta. Expect: run `status=env-unavailable`, check `neutral`, teks `preview not ready (retry)`; run **tidak** dihitung di stability.

## ING — Ingest JUnit (6)

- **ING-01 — Counts dasar.** Fixture 67 testcase (64 pass, 3 fail). Expect: `total=67, passed=64, failed=3, skipped=0`.
- **ING-02 — Skip dihitung penuh.** 10 testcase, 2 `<skipped/>`, 6 pass, 2 fail. Expect: `total=10`; `pass_rate = 6/10 = 0.60` (bukan 6/8).
- **ING-03 — Multi-suite akumulasi.** Dua `<testsuite>` (3 + 4 testcase). Expect: `total=7`, tidak dobel.
- **ING-04 — XML rusak.** File JUnit malformed. Expect: run `status=parse-error`, dashboard menampilkan banner, app tidak crash.
- **ING-05 — Artefak hilang.** File tidak ada. Expect: run `status=missing-artifact`, TSI kolom `—`.
- **ING-06 — ID dari nama test.** Testcase `SV-SMK-01 landing renders`. Expect: terbaca ID `SV-SMK-01` (prefix `SV-`, case-sensitive).

## COV — Coverage traceability (9)

- **COV-01 — Partial match.** SPEC 67 ID; JUnit mengandung 60 ID unik. Expect: `coverage = 60/67 = 0.895522` (dipakai apa adanya di rumus).
- **COV-02 — Coverage penuh.** Semua ID ada. Expect: `coverage = 1.0`, gap list `0 gaps`.
- **COV-03 — Coverage nol.** Tidak ada ID cocok. Expect: `coverage = 0.0`, **67 gaps** tampil.
- **COV-04 — Case-sensitive.** Test membawa `sv-smk-01` (huruf kecil). Expect: **tidak** cocok; tercatat `orphan test`.
- **COV-05 — Duplicate ID.** SPEC memuat `SV-TSI-01` dua kali. Expect: warning `duplicate spec id`, entri dihitung satu.
- **COV-06 — Orphan test.** Test membawa `SV-XXX-99` (tidak di SPEC). Expect: tercatat orphan; coverage tidak naik.
- **COV-07 — Spec bertambah.** SPEC naik 67 → 70 ID; test tetap 60. Expect: `coverage = 60/70 = 0.857143` (pembulatan 6 desimal); gap naik 7 → 10.
- **COV-08 — Spec kosong (renorm).** SPEC 0 ID. Expect: coverage `n/a`; `TSI = round(100×(0.60×stability + 0.40×pass_rate))`.
- **COV-09 — Tabel detail.** Buka run detail → coverage table. Expect: 67 baris (ID · status · test name), gap diberi highlight; `SV-SMK-01` status `covered`.

## FLK — Stability (6)

- **FLK-01 — Conflict 1 test.** SHA-A punya 2 run; test `T` gagal di run 1, lulus di run 2; tested 67. Expect: `conflicted=1`, `stability = 1 − 1/67 = 0.985075` (sama dengan nilai stability di TSI-01).
- **FLK-02 — Semua konsisten.** SHA-A 2 run, verdict sama semua. Expect: `stability = 1.0`.
- **FLK-03 — Baru 1 run.** SHA-B baru sekali. Expect: `stability = 1.0` + label `estimated (<2 runs)`.
- **FLK-04 — Cross-SHA diabaikan.** SHA-A gagal, SHA-B lulus. Expect: tidak ada conflict (flake hanya antar run SHA sama).
- **FLK-05 — 3 run, L-L-G.** SHA-C: run 1 pass, run 2 pass, run 3 fail untuk test A. Expect: `conflicted` (per SHA, bukan mayoritas).
- **FLK-06 — Rename bukan conflict.** Run 1 test `SV-TSI-01 x`, run 2 `SV-TSI-01 y` (SHA sama). Expect: tidak dianggap conflict (key = nama persis).

## TSI — Formula (8)

- **TSI-01 — Contoh fixture utama.** coverage 60/67, stability 66/67, pass 64/67. Expect: `TSI = round(100×(0.50×0.895522 + 0.30×0.985075 + 0.20×0.955224)) = round(93.43) = 93`. (Terverifikasi kalkulator; jangan hitung ulang dengan float berbeda — ikuti rumus persis.)
- **TSI-02 — Sempurna.** 1.0/1.0/1.0. Expect: `TSI = 100`.
- **TSI-03 — Nol semua.** 0.0/0.0/0.0. Expect: `TSI = 0`.
- **TSI-04 — Rounding.** Kombinasi yang menghasilkan `95.4999` → `95`; `95.5` → `96` (Math.round, setengah ke atas).
- **TSI-05 — Pass sempurna, coverage nol.** pass 1.0, coverage 0.0, stability 1.0. Expect: `TSI = round(100×(0.30×1.0 + 0.20×1.0)) = 50`.
- **TSI-06 — Deterministik.** Input sama dijalankan dua kali. Expect: JSON byte-identik (tanpa timestamp di dalam nilai).
- **TSI-07 — Delta.** Run sebelum 96, sekarang 93. Expect: `delta = -3` di dashboard dan komentar PR.
- **TSI-08 — Run pertama.** Tidak ada run sebelumnya. Expect: delta `null`, tampil `first run` (bukan `0`).

## RAT — Ratchet (6)

- **RAT-01 — Drop diblokir.** Baseline `main` 96; PR 93. Expect: status check merah, teks `TSI dropped 96 → 93 (ratchet)`.
- **RAT-02 — Sama = lolos.** Baseline 96; PR 96. Expect: hijau.
- **RAT-03 — Naik update baseline.** Baseline 96; PR 98; merge. Expect: baseline `main` jadi 98.
- **RAT-04 — PR pertama.** Belum ada baseline. Expect: hijau; baseline diset dari TSI PR ini.
- **RAT-05 — TSI null.** Artefak hilang (CFG-05). Expect: check `neutral` (bukan merah).
- **RAT-06 — Status check terpisah.** Buka tab Checks PR. Expect: **dua** check: TestSprite + SuiteVitals Ratchet.

## PRM — Komentar PR (5)

- **PRM-01 — Isi komentar.** Push ke PR (fixture TSI 93, baseline main 96). Expect: baris ringkasan persis `TSI 93 (Δ −3 vs main 96)` + 3 baris metrik + link run detail.
- **PRM-02 — Edit in place.** Push kedua. Expect: komentar yang sama ter-update (marker `<!-- suitevitals -->`), jumlah komentar tetap 1.
- **PRM-03 — Check merah tetap berkomentar.** RAT-01 terjadi. Expect: komentar tetap terkirim walau check gagal.
- **PRM-04 — Tanpa permission write.** Workflow tanpa `pull-requests: write`. Expect: warning di log, Action tidak crash, check tetap jalan.
- **PRM-05 — Fork PR.** PR dari fork. Expect: job SuiteVitals skip (bukan merah permanen).

## VDT — Verdict Trust Gate (3, inti — PRD F18)

*Latar riset: issue `testsprite-cli` #375 (refusal diskor failure), #380 (rerun tak-lengkap exit 0), #378 (diff run tanpa verdict).*

- **VDT-01 — Refused bukan failure.** Run record memuat test `SV-COV-01` berstatus `refused` (keluar karena refusal, bukan assertion). Expect: run `status=incomplete`, test berlabel `refused (not a failure)`, tidak masuk `failed`, TSI `n/a` + alasan `verdict refused`.
- **VDT-02 — Rerun tak-lengkap ditolak.** Batch 3 diminta, 2 selesai, 1 refused. Expect: gate label `incomplete rerun refused`, check `neutral` (bukan hijau), teks persis `2/3 completed, 1 refused`.
- **VDT-03 — Diff tanpa verdict ditolak.** Diff run A (terminal) vs run B (in-flight). Expect: diff ditolak, label `unverdictable run` — bukan `unchanged`. Run `incomplete` tidak masuk stability dan tidak meng-update baseline.

## DRF — Spec Drift Detection (3, inti — PRD F19)

*Latar riset: "PRD vs shipped behaviour diverge — can the tool tell why?" (Product Hunt, Mar 2026); mirror-image tests (StickyMinds, Mar 2026).*

- **DRF-01 — Drift vs bug.** Test `SV-COV-07` gagal padahal ID-nya dihapus dari SPEC sejak run prev. Expect: klasifikasi `spec-drift` (bukan `regression`), label menunjuk ID yang berubah + diff satu baris SPEC.
- **DRF-02 — Added/removed list.** SPEC 67→70 ID (3 baru, 2 dihapus: `SV-COV-07`, `SV-RAT-06`); run now. Expect: daftar tepat `3 added (untested)` + `2 removed (orphaned tests: SV-COV-07, SV-RAT-06)`.
- **DRF-03 — Spec-only neutral.** PR hanya mengubah SPEC (tambah ID, tanpa ubah kode); TSI turun via coverage. Expect: ratchet `neutral` + label `spec-change only` (bukan merah); baseline tidak turun.

## FIX — Auto-Remediation Loop (8, inti — HEADLINE, PRD F20)

*Fixture: `fixtures/verdicts.md` — 5 klasifikasi (refused / incomplete / drift / regression / no-bundle). Fixture regression = PR #12: run TSI 90 (coverage 57/67 = 0.850746, stability 66/67 = 0.985075, pass 61/67 = 0.910448 → `TSI = round(90.30) = 90`), baseline `main` 93; test `SV-TSI-04` gagal; bundle `fixtures/bundle/step-fail/` (`failed at step 3/5: click "Verify"`, `expected "95", received "96"`, `snapshotId snp_A1`).*

- **FIX-01 — Regression → fix → green.** Verdict `regression` + bundle tersedia. Expect: action `dispatch`; agent commit `fix(meerkat): correct rounding rule`; run ulang `TSI 93`; check hijau; komentar memuat baris persis `loop: regression → fix proposed → green`.
- **FIX-02 — Gate refused.** Verdict `refused` (fixture VDT-01). Expect: action `none`, label `refused (not a failure)`; **tidak ada** commit/dispatch; baris persis `loop: refused → no action`.
- **FIX-03 — Gate incomplete.** Rerun tak-lengkap (fixture VDT-02). Expect: action `none`, label `incomplete rerun refused`; baris `loop: incomplete → held`.
- **FIX-04 — Gate drift.** `spec-drift` (fixture DRF-01, `SV-COV-07` gagal, ID dihapus dari SPEC). Expect: action `test-update-needed`, **tidak** menyentuh kode; baris `loop: spec-drift → test update needed`.
- **FIX-05 — Bundle hilang.** `test failure get` exit code 3. Expect: action `manual`, label `no bundle — manual loop`; check tetap `neutral`, tidak crash.
- **FIX-06 — Agent gagal → eskalasi.** Setelah 1 percobaan fix, rerun masih merah. Expect: label `escalated to human`; **tidak** retry lebih dari 1; komentar menyebut bundle tetap tersedia.
- **FIX-07 — Loop terekam & non-gating.** Halaman Loop menampilkan 1 baris untuk PR fixture: `classification=regression`, `action=fix proposed`, `result=green`. Saat loop tidak bisa jalan (bundle hilang), ratchet tetap `neutral` — loop tidak pernah memaksa merah/hijau.
- **FIX-08 — Tidak mengubah test + deterministik.** Usulan fix yang menyentuh test/SPEC ditolak, label `refused: test change proposed`. Input verdict sama → keputusan `dispatch`/`none` + label byte-identik.

## DSH — Dashboard (8)

- **DSH-01 — Run list.** Buka `/runs`. Expect: tabel urut terbaru dulu, kolom PR · SHA · TSI · delta · waktu; 10 run demo tampil.
- **DSH-02 — Run detail.** Klik run fixture (TSI 93). Expect: `TSI 93` + `coverage 60/67` + `stability 66/67` + coverage table 67 baris + flake table 1 baris conflict + panel verdict + environment/context.
- **DSH-03 — Score history.** Buka history. Expect: tabel 10 baris terakhir dengan kolom TSI (angka persis).
- **DSH-04 — Empty state.** Repo baru 0 run. Expect: pesan kosong + instruksi pasang Action (bukan tabel kosong).
- **DSH-05 — Filter repo.** 2 project demo (10 + 3 run). Expect: dropdown tepat 2 opsi; pilih project kedua → tabel tepat 3 baris.
- **DSH-06 — Badge parse-error.** Run `status=parse-error`. Expect: badge `incomplete`, kolom TSI `—`, penjelasan tampil.
- **DSH-07 — Auth.** Buka `/runs` tanpa login. Expect: redirect `/login`; setelah login kembali ke `/runs`.
- **DSH-08 — Halaman Loop.** Buka `/loop`. Expect: 1 baris untuk PR loop fixture dengan kolom `classification=regression` · `action=fix proposed` · `result=green`; label sama persis dengan komentar PR (FIX-01).

## CLI — CLI produk (6)

- **CLI-01 — Output JSON.** `suitevitals score --junit fixtures/67t.xml --spec fixtures/SPEC.md`. Expect: JSON valid berisi `tsi: 93`, `coverage`, `stability`, `pass_rate`, `gaps`.
- **CLI-02 — Identik dengan dashboard.** Input fixture sama. Expect: `tsi` CLI == TSI run dashboard untuk fixture sama (`93`).
- **CLI-03 — Deterministik.** Dijalankan 2×. Expect: byte-identik.
- **CLI-04 — Argumen hilang.** `suitevitals score` tanpa flag, file default tidak ada. Expect: exit code `3`, stderr `file not found`.
- **CLI-05 — Usage.** `suitevitals score --help`. Expect: exit code `0`, usage di stdout.
- **CLI-06 — Default run.** Dijalankan di direktori berisi `SPEC.md` + `testsprite-junit.xml` tanpa flag. Expect: exit code `0`, TSI sesuai kedua file itu.

## NAR — Step Narrative (10)

*Fixture: `fixtures/bundle/step-fail/` — bundle `test failure get` untuk SV-TSI-04: 5 step, step 3 (`click "Verify"`) gagal, assertion `expected "95", received "96"`, `snapshotId: snp_A1`.*

- **NAR-01 — Step gagal tampil.** Buka run detail → tab `Failures`. Expect: baris persis `failed at step 3/5: click "Verify"`.
- **NAR-02 — Assertion persis.** Expect: `expected "95", received "96"` (bukan ringkasan "assertion failed").
- **NAR-03 — Step tetangga.** Expect: konteks tampil: `step 2 ✓` dan `step 4 — not run`.
- **NAR-04 — Mixed snapshot ditolak.** Dua file bundle membawa `snapshotId` berbeda (`snp_A1`, `snp_B2`). Expect: narrative ditolak, label `mixed-snapshot bundle refused`.
- **NAR-05 — Run hijau tanpa blok.** Semua test lulus. Expect: komentar PR **tanpa** blok narrative (tidak ada placeholder kosong).
- **NAR-06 — Fallback saat bundle gagal.** `test failure get` exit code 3. Expect: komentar memuat baris JUnit-only `SV-ERR-02 failed (steps unavailable)`; check tidak crash.
- **NAR-07 — Cap 3 narrative.** 4 test gagal. Expect: maksimal **3** narrative + baris `… and 1 more failing test`.
- **NAR-08 — Label hypothesis.** Bundle memuat root-cause hypothesis. Expect: tampil di bawah label `hypothesis (from TestSprite)` — bukan sebagai fakta.
- **NAR-09 — Edit-in-place.** PR berisi 3 narrative; push kedua memperbaiki 1 failure. Expect: komentar ter-update in place, jumlah narrative **2**.
- **NAR-10 — Determinisme & konsistensi.** Bundle sama dijalankan dua kali. Expect: narrative byte-identik; teks di tab `Failures` dashboard **sama persis** dengan komentar PR.

## ERR — Error & edge state (4)

- **ERR-01 — JUnit kosong.** `<testsuite>` tanpa testcase. Expect: `total=0`, TSI `n/a` (guard divide-by-zero), app tidak crash.
- **ERR-02 — API gagal.** `POST /api/runs` timeout (simulasi). Expect: Action retry 1× lalu gagal dengan pesan jelas; run tidak tercatat setengah jadi.
- **ERR-03 — Unauthorized write.** `POST /api/runs` tanpa secret header. Expect: `401`.
- **ERR-04 — Zero-test suite.** JUnit ada tapi semua testcase 0. Expect: run `status=complete`, `total=0`, dashboard menampilkan peringatan `suite kosong` (bukan skor 100).

---

## Data uji & akun

| Item | Nilai |
|---|---|
| Akun | `demo@suitevitals.dev` / `demo-password-1` (Test Account Credentials) |
| Fixtures | `fixtures/junit/67t.xml` (64/3/0) · `fixtures/junit/flaky.xml` (SHA-A 2 run) · `fixtures/SPEC.md` (67 ID, format `SV-XXX-NN`) · `fixtures/bundle/step-fail/` (5 step, step 3 fail, `snapshotId snp_A1`) · `fixtures/verdicts.md` (refused / incomplete / drift / regression / no-bundle) |
| Data demo | 2 project (10 + 3 run; TSI 88→93, satu flake, satu gap, **satu PR loop regression→fix→green**) — ter-seed tiap deploy preview |
| Reset | `POST /api/test/reset` (preview only, secret header) |
| Concurrency | 1 (DB preview shared) |

## Aturan menjaga kualitas suite

1. Deskripsi = kontrak; UI berubah → skenario diubah di PR yang sama.
2. Setiap skenario minimal satu angka/label eksak.
3. Bug nyata yang tertangkap → tambah/perkuat skenario penangkapnya + catat di tabel proof-of-loop README.
4. **Anti-dangkal:** skenario UI (SMK/DSH/PRM/ENV/FIX) wajib mengassert **nilai eksak dari fixture** (angka, baris persis, jumlah baris) — kata "tampil/ada/berubah sesuai" tanpa angka = skenario tidak valid.
