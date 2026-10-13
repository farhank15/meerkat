# PRD — Meerkat

**Versi 4.0 · 13 Okt 2026 · untuk TestSprite Hackathon S4 (16–22 Okt) · nama final: Meerkat (working name lama: SuiteVitals)**

> **Konvensi nama (keputusan 12 Okt, jangan dibuka lagi):** produk/display/repo/URL = **Meerkat**. Identifier teknis tetap `suitevitals`/`SV-` (nama CLI, action, marker `<!-- suitevitals -->`, nama check, prefix ID skenario, akun demo) — supaya seluruh kontrak angka eksak di SPEC tidak pecah. Mengganti identifier teknis = mengubah SPEC+PRD+fixture bersamaan (dilarang AGENTS).

> **Reframe v4.0 (keputusan 13 Okt — menggantikan v3.2).** Fokus project digeser supaya selaras rubrik S4 secara langsung: **app quality (40) + tests that run themselves (40) + satu hook inovatif (20)**. Konsekuensinya: fitur yang sudah jadi prior art dipotong (F11 attribution, F12–F13 replay, F14 badge, F15 impact select, F17 kill rate), dan dua fitur baru ditambahkan (**F20 auto-remediation loop** — headline, dan **F21 preview environment matrix** — infrastruktur). Alasan lengkap + bukti riset ada di [`INTEGRATION.md`](INTEGRATION.md) §0. Nomor F yang hilang (F11–F15, F17) = sengaja, jejak fitur yang dipotong.

> PRD ini dipakai untuk dua hal: (1) sumber kebenaran produk sebelum kode pertama, (2) **di-upload ke portal TestSprite sebagai PRD** saat membuat suite. Setiap acceptance criterion memuat **nilai pasti** — deskripsi nilai pasti adalah input utama test generator.
>
> **Dokumen pendamping:** `HARI-H.md` (strategi & runbook), `RUNBOOK.md` (eksekusi step-by-step), `SPEC.md` (96 skenario detail), `VIDEO.md` (shot list + voice-over), `INTEGRATION.md` (diferensiasi + bukti riset), `README.md` (sampul).

---

## 1. Ringkasan produk & masalah

**Keluhan nomor satu di dunia test AI (bukan opini, ada sumbernya):**

> *"AI-generated tests fail in a way that's worse than failing. They pass."* — test hijau yang **tidak menangkap apa-apa**
>
> *"Flaky tests ... biggest QA problem of 2026 — CI noise makin parah karena test AI"*

Tim yang pakai TestSprite (dan agen AI lain) punya suite yang **hijau**, tapi tidak bisa menjawab:

1. Suite saya **menutup requirement saya** yang mana? Mana yang bocor?
2. Hijau ini **stabil** atau kebetulan? (flake rate)
3. Sejak PR terakhir, kekuatan suite saya **naik atau turun**?
4. Dan yang paling penting: **verdict ini bisa dipercaya?** — dan kalau ya, **siapa yang memperbaiki kegagalannya?**

**Meerkat menjawab keempatnya — lalu menutup loop-nya.**

### Tiga pilar (peta ke rubrik S4)

| Pilar | Rubrik | Isi |
|---|---|---|
| **1 · App** | Project quality · **40** | Dashboard Meerkat: app nyata yang dipoles, kelas devtools — diuji oleh suite-nya sendiri (dogfooding) |
| **2 · Wiring** | Tests that run themselves · **40** | TestSprite terpasang dalam-dalam: tiap PR dites di **preview URL-nya sendiri** (F21), suite penuh tiap push, ratchet menahan merge, skenario bernilai pasti |
| **3 · Loop** | Innovation · **20** | **Loop yang menutup sendiri — tapi hanya saat verdict-nya jujur.** Verdict audit (F18) + spec-drift (F19) menentukan apakah agent boleh memperbaiki (F20) |

**Thesis submission (satu kalimat):** *"TestSprite memberi verdict-nya. Meerkat menambah lapisan kepercayaan di atasnya — dan hanya bertindak saat verdict itu layak dipercaya."*

**Empat metrik (persis, bisa direproduksi):**

| Metrik | Rumus |
|---|---|
| **Coverage** | `matched SPEC IDs / total SPEC IDs` — mapping `SPEC.md` ↔ nama test di JUnit |
| **Stability** | `1 − (conflicted tests / tested tests)` — test dengan verdict beda pada run ber-SHA sama; `< 2 run` → `1.0` (label *estimated*) |
| **Pass rate** | `passed / total` |
| **TSI (Test Strength Index)** | `round(100 × (0.50×coverage + 0.30×stability + 0.20×pass_rate))` |

Ditambah **ratchet**: TSI PR tidak boleh turun di bawah baseline `main` — check menahan merge.

**Kenapa TestSprite Hackathon:** produk ini **hidup di atas TestSprite** — pakai `testsprite-action@v1` (JUnit + outputs resmi), memakai Environments per-PR, dan mengonsumsi failure bundle resmi. Bukan wrapper; ini instrumentasi + loop yang TestSprite sendiri tidak sediakan.

**Target rubrik S4:** Project Quality 40 · Tests That Run Themselves 40 · Innovation 20 · Bonus engagement (+ **side-quest CLI bonus $1.000** — lihat §11).

---

## 2. Persona & alur utama

| Persona | Job |
|---|---|
| **Maintainer** (repo owner) | Pasang Action 5 menit → lihat TSI di tiap PR → kejar coverage gap → ratchet jaga skor → biarkan loop memperbaiki regresi |
| **Reviewer PR** | Baca komentar bot: TSI + delta vs baseline + gap baru + klasifikasi verdict → putuskan merge |
| **Juri / pengunjung** | Buka halaman publik → lihat skor suite project ini sendiri + riwayat loop (dogfooding) |

**Alur utama (wajib jalan di demo):**

1. PR dibuka → Vercel bikin preview → TestSprite trigger → suite jalan **di URL preview PR itu** (F21)
2. `testsprite-action` selesai → Meerkat baca JUnit + `SPEC.md`
3. Hitung coverage/stability/pass → **TSI** → banding baseline → **status check** + komentar PR
4. **Verdict audit (F18) + spec-drift (F19)** mengklasifikasi setiap kegagalan:
   - `refused` / rerun tak-lengkap / spec-drift → **tidak** diperbaiki otomatis
   - `regression` asli + bundle tersedia → **F20** dispatch agent → agent baca failure bundle → push fix ke branch PR → run ulang otomatis → hijau
5. Data terkirim ke dashboard → run list, coverage detail, score history, **halaman Loop**
6. Halaman publik `/s/{slug}` → kartu skor untuk dibagikan

---

## 3. Fitur (acceptance criteria nilai pasti)

> Fitur **F11–F15** dan **F17** dipotong di v4.0 (prior art / di luar fokus rubrik). Lihat `INTEGRATION.md` §0 untuk alasan.

### F1 — Koneksi & konfigurasi Action
- **F1.1** Pasang `suitevitals/action@v1` di `.github/workflows/test.yml`. `[Value]` Input minimal: `spec-path` (default `SPEC.md`), `junit-path` (default `testsprite-junit.xml`), `api-key` (secret).
- **F1.2** `[Edge]` Tanpa `api-key` → Action gagal dengan pesan jelas `SuiteVitals: API key missing`, exit code ≠ 0, **tidak** kirim data setengah jadi.
- **F1.3** `[Edge]` `spec-path` salah → status `warning` (bukan error), TSI dihitung dengan coverage `0.00` dan label `spec-missing`.

### F2 — Ingest JUnit
- **F2.1** `[Value]` Fixture JUnit berisi 67 testcase (64 pass, 3 fail) → `total=67, passed=64, failed=3, skipped=0`.
- **F2.2** `[Value]` JUnit berisi 10 testcase dengan 2 `<skipped/>` → `total=10, passed=6, failed=2, skipped=2`; pass rate dihitung dari `passed/total` (bukan `passed/(total−skipped)`).
- **F2.3** `[Edge]` JUnit malformed (XML rusak) → run disimpan dengan status `parse-error`, dashboard menampilkan banner, app tidak crash.
- **F2.4** `[Edge]` File JUnit tidak ada → run `status=missing-artifact`; Action tetap lanjut ke komentar PR dengan TSI `null` + alasan.
- **F2.5** `[Value]` Nama testcase `SV-SMK-01 landing renders` → dianggap membawa ID `SV-SMK-01`.
- **F2.6** `[Edge]` Beberapa `<testsuite>` dalam satu file → diakumulasi, tidak dobel.

### F3 — Coverage traceability
- **F3.1** `[Value]` SPEC berisi 67 ID, JUnit mengandung 60 ID unik (cocok case-sensitive) → `coverage = 60/67 = 0.895522` (TSI memakai nilai ini apa adanya).
- **F3.2** `[Value]` Semua ID cocok → `coverage = 1.0`, gap list kosong → dashboard menampilkan `0 gaps`.
- **F3.3** `[Value]` Tidak ada ID cocok → `coverage = 0.0`, **67 gaps**.
- **F3.4** `[Edge]` Case (`sv-smk-01` vs `SV-SMK-01`) → **tidak** cocok; kecocokan ID case-sensitive (kontrak eksplisit).
- **F3.5** `[Edge]` Dua ID sama di SPEC → warning `duplicate spec id`, keduanya dihitung sebagai satu entri tapi warning tampil.
- **F3.6** `[Edge]` Test membawa ID yang tidak ada di SPEC → tercatat sebagai `orphan test`, **tidak** menaikkan coverage.
- **F3.7** `[Value]` SPEC diperbarui (+3 ID baru) → run berikutnya coverage turun sesuai (mis. 60/70 = 0.857143) sampai test baru muncul.
- **F3.8** `[Edge]` SPEC kosong (0 ID) → coverage `n/a`, TSI dihitung tanpa komponen coverage dengan pembagian ulang bobot: `round(100×(0.60×stability + 0.40×pass_rate))`.
- **F3.9** `[Value]` Halaman coverage detail menampilkan tabel 67 baris: ID · status (`covered`/`gap`) · test name — gap diberi highlight.

### F4 — Stability (flake)
- **F4.1** `[Value]` SHA sama punya 2 run: test `T` gagal di run 1, lulus di run 2 → `conflicted=1`, `tested=67` → `stability = 1 − 1/67 = 0.985075`.
- **F4.2** `[Value]` SHA sama 2 run, semua verdict sama → `stability = 1.0`.
- **F4.3** `[Value]` SHA hanya punya 1 run → `stability = 1.0` + label `estimated (<2 runs)`.
- **F4.4** `[Edge]` Run dengan SHA berbeda → **tidak** pernah dipasangkan untuk flake.
- **F4.5** `[Edge]` 3 run SHA sama, test A: L-L-G (gagal terakhir) → tetap `conflicted` (hitung per SHA, bukan mayoritas).
- **F4.6** `[Edge]` Test name beda di dua run (rename) → tidak dianggap conflict (key = test name persis).

### F5 — TSI computation
- **F5.1** `[Value]` **Contoh penuh (fixture utama):** coverage 60/67, stability 66/67, pass 64/67 → `TSI = round(100×(0.50×0.895522 + 0.30×0.985075 + 0.20×0.955224)) = round(93.43) = 93`.
- **F5.2** `[Value]` Semua sempurna (1.0/1.0/1.0) → `TSI = 100`.
- **F5.3** `[Value]` Semua nol → `TSI = 0`.
- **F5.4** `[Edge]` Rounding: `95.4999 → 95`, `95.5 → 96` (Math.round setengah ke atas).
- **F5.5** `[Edge]` `pass_rate=1.0` tapi coverage `0.0` → `TSI = round(100×(0.30×1.0 + 0.20×1.0)) = 50` (bukan exception).
- **F5.6** `[What]` Input sama → output sama (deterministik, tanpa waktu/Random di formula).
- **F5.7** `[Value]` Delta: run sebelumnya 96, run sekarang 93 → `delta = −3` tampil di dashboard dan komentar PR.
- **F5.8** `[Edge]` Run pertama (tidak ada baseline) → `delta = null` (tampil `first run`, bukan `0`).

### F6 — Ratchet (baseline & gating)
- **F6.1** `[Value]` `main` baseline TSI 96; PR TSI 93 → status check **merah** `TSI dropped 96 → 93 (ratchet)`.
- **F6.2** `[Value]` PR TSI 96 (sama) → hijau (ratchet = tidak turun, bukan harus naik).
- **F6.3** `[Value]` PR TSI 98 → hijau + baseline `main` di-update ke 98 saat merge.
- **F6.4** `[Edge]` Belum ada baseline (PR pertama) → hijau, baseline diset dari nilai PR pertama.
- **F6.5** `[Edge]` TSI `null` (artefak hilang) → status `neutral`, bukan merah (jangan block karena infra rusak).
- **F6.6** `[Edge]` Draft PR → komentar + check tetap terpasang (Include Draft PRs ON).

### F7 — PR comment (bot)
- **F7.1** `[Value]` Komentar memuat: baris ringkasan persis `TSI 93 (Δ −3 vs main 96)` + 3 baris metrik + link ke run detail. Format: satu baris ringkasan + 3 baris metrik.
- **F7.2** `[Edge]` Push kedua di PR yang sama → komentar **di-edit in place** (bukan komentar baru) — kunci: marker `<!-- suitevitals -->`.
- **F7.3** `[Edge]` Check merah saat TSI turun → komentar tetap terkirim (info walau gagal).
- **F7.4** `[Edge]` Tanpa `pull-requests: write` permission → warning di log, tidak crash Action.
- **F7.5** `[Edge]` Fork PR (tanpa secret) → job di-skip, bukan merah permanen.

### F8 — Dashboard (app quality — diperluas di v4)
- **F8.1** `[What]` Halaman runs: tabel PR · SHA · TSI · delta · waktu. `[Value]` Urut terbaru dulu.
- **F8.2** `[What]` Run detail: 3 metrik + tabel coverage (F3.9) + flake table (test conflict) + panel verdict (klasifikasi F18/F19) + environment/context (F21).
- **F8.3** `[What]` Score history: tabel 10 run terakhir dengan kolom TSI (angka, **tabel dulu — chart dekoratif**, supaya assertion exact-value).
- **F8.4** `[Edge]` Repo dengan 0 run → empty state + instruksi pasang Action (bukan tabel kosong).
- **F8.5** `[Edge]` Filter repo: dropdown semua repo milik user.
- **F8.6** `[Edge]` Run `parse-error` → badge `incomplete` + penjelasan, TSI kolom `—`.
- **F8.7** `[Edge]` Login: session sederhana (email+password), halaman runs tanpa login → redirect `/login`.
- **F8.8** `[What]` **Halaman Loop (F20)**: daftar PR dengan kolom verdict-classification · action · hasil. `[Value]` Satu baris per PR; label persis seperti di komentar bot.

### F9 — Public share page
- **F9.1** `[What]` `/s/{slug}` publik: kartu skor (TSI besar + 3 metrik + delta) + link ke repo. Tanpa login.
- **F9.2** `[Edge]` Slug tidak ada → 404 + pesan.
- **F9.3** `[Edge]` Share page **tidak** memuat data repo privat (hanya project yang di-share).

### F10 — CLI produk (fitur Quality; bonus CLI $1.000 = side-quest kontribusi ke `testsprite-cli`, lihat §11)
- **F10.1** `[Value]` `suitevitals score --junit x.xml --spec SPEC.md` → JSON: `{tsi, coverage, stability, pass_rate, gaps: [...]}`. **Angka identik** dengan yang dashboard tampilkan untuk input yang sama.
- **F10.2** `[Value]` Input sama → output sama (deterministik, byte-identik).
- **F10.3** `[Edge]` Argumen hilang → exit code `2` + usage di stderr (bukan stack trace).
- **F10.4** `[Edge]` File tidak ada → exit code `3` + pesan `file not found: <path>`.
- **F10.5** `[Edge]` `--json` default; `--pretty` untuk manusia. Output JSON valid (bisa `jq .tsi`).
- **F10.6** `[Edge]` Tanpa flag sama sekali → tetap jalan dengan default `SPEC.md` + `testsprite-junit.xml`.

### F16 — Step Narrative (EXPLAIN): "step mana yang gagal?"

Sumber data: bundle `testsprite test failure get <test-id> --out <dir>` — self-contained: failing step + tetangga, screenshots, DOM snapshot, test source, root-cause hypothesis, fix target, **satu `snapshotId`**. Ini juga **input untuk F20** (auto-remediation). CLI resmi menolak menggabungkan data dua run; Meerkat mengikuti kontrak yang sama.

- **F16.1** `[Value]` Bundle fixture: 5 step, step 3 gagal (`click "Verify"`) → narrative menampilkan `failed at step 3/5: click "Verify"`.
- **F16.2** `[Value]` Assertion dirender persis: `expected "95", received "96"`.
- **F16.3** `[Value]` Step tetangga sebagai konteks: `step 2 ✓` dan `step 4 — not run`.
- **F16.4** `[Edge]` Dua file di direktori bundle membawa `snapshotId` berbeda (`snp_A1` vs `snp_B2`) → narrative **ditolak**, label `mixed-snapshot bundle refused`.
- **F16.5** `[Edge]` Run hijau → blok narrative **hilang** dari komentar (tanpa placeholder kosong).
- **F16.6** `[Edge]` `test failure get` exit code 3 (mis. key tanpa scope) → fallback baris JUnit-only `SV-ERR-02 failed (steps unavailable)`; check tidak pernah crash.
- **F16.7** `[Value]` 4 test gagal → maksimal **3** narrative + baris `… and 1 more failing test`.
- **F16.8** `[Edge]` Hypothesis dari bundle dirender di bawah label `hypothesis (from TestSprite)` — tidak pernah disajikan sebagai fakta.
- **F16.9** `[Value]` Push kedua memperbaiki 1 dari 3 failure → komentar **edit-in-place**, jumlah narrative 3 → 2.
- **F16.10** `[Value]` Deterministik: bundle sama → narrative byte-identik (tanpa timestamp di dalam teks).
- **F16.11** `[What]` Narrative tampil juga di run detail dashboard (tab `Failures`), teks sama persis dengan komentar PR.
- **F16.12** `[Edge]` JSON bundle rusak → label `bundle unreadable`, perilaku fallback sama dengan F16.6.

### F18 — Verdict Trust Gate (validasi verdict itu sendiri)

Motivasi riset (bukan opini): klaster issue `[Hackathon]` Okt 2026 di `TestSprite/testsprite-cli` — **#375** (refusal out-of-credits/feature-gated di-skor sebagai failure), **#380** (batch `--wait` exit 0 padahal rerun tak-lengkap), **#378** (`test diff` membandingkan run tanpa verdict). Meerkat tidak bisa memperbaiki CLI orang lain, tapi **menolak mempercayai verdict tak-berverdict** dari sisi konsumen — dan ini yang menggerakkan F20.

- **F18.1** `[Value]` Test berstatus `refused` (keluar karena refusal, bukan assertion) → run `status=incomplete`, test berlabel `refused (not a failure)`, **tidak** masuk `failed`, TSI `n/a` + alasan `verdict refused`.
- **F18.2** `[Value]` Rerun/batch tak-lengkap (3 diminta, 2 selesai, 1 refused) → gate label `incomplete rerun refused`, check `neutral` (**bukan hijau**), teks `2/3 completed, 1 refused`.
- **F18.3** `[Edge]` Diff dua run di mana satu belum terminal → diff **ditolak**, label `unverdictable run` — bukan `unchanged`.
- **F18.4** `[Edge]` Run `incomplete` tidak pernah meng-update ratchet baseline dan tidak dihitung di stability (bukan conflict, bukan pass).

### F19 — Spec Drift Detection (spec sebagai oracle)

Motivasi riset: keluhan komunitas #1 (Product Hunt, Mar 2026) — *"PRD vs shipped behaviour diverge; can the tool tell you why, not just that they do?"* — plus pola *"mirror-image tests"* dan happy-path bias. Test gagal ada dua sebab yang beda tindakan: **bug** (perbaiki kode) vs **drift** (spec berubah, perbarui test). F19 memisahkan keduanya — dan **memutuskan apakah F20 boleh menyentuh kode**.

- **F19.1** `[Value]` Test gagal padahal SPEC berubah sejak run prev (ID-nya dihapus/diubah di SPEC) → klasifikasi `spec-drift` (**bukan** `regression`), label menunjuk ID SPEC yang berubah + diff satu baris.
- **F19.2** `[Value]` SPEC 67→70 ID (3 baru, 2 dihapus), run now → daftar tepat `3 added (untested)` + `2 removed (orphaned tests: SV-COV-07, SV-RAT-06 — sebut nama persis)`.
- **F19.3** `[Edge]` PR yang **hanya** mengubah SPEC (tambah ID, tanpa ubah kode) membuat TSI turun via coverage → ratchet `neutral` + label `spec-change only` (**bukan merah**), baseline tidak turun.

### F20 — Auto-Remediation Loop (HEADLINE v4: loop yang menutup sendiri, hanya saat verdict jujur)

Ini pembeda utama project. Setelah TestSprite gagal di sebuah PR, Meerkat **mengklasifikasi verdict lebih dulu**, lalu **hanya** memicu agent perbaikan kalau verdict-nya layak dipercaya. Agent membaca failure bundle (F16), memperbaiki akar masalah di branch PR, dan run diulang otomatis sampai hijau. Loop-nya terekam di thread PR + halaman Loop dashboard.

**Tabel keputusan (deterministik — ini inti produk):**

| Klasifikasi verdict | Sumber | Aksi Meerkat | Label |
|---|---|---|---|
| `refused` | F18.1 | **Tidak ada perbaikan** — bukan kegagalan | `refused (not a failure)` |
| rerun tak-lengkap | F18.2 | **Tidak ada perbaikan** — gate ditahan | `incomplete rerun refused` |
| `spec-drift` | F19.1 | **Tidak ada perbaikan kode** — test/spec yang perlu diperbarui | `spec-drift — test update needed` |
| `regression` (spec tidak berubah) + bundle tersedia | F16 | **Dispatch agent** → perbaiki kode → push ke branch PR → run ulang | `regression — fix proposed` |
| bundle tidak tersedia | F16.6 | Tidak auto-fix — loop manual | `no bundle — manual loop` |

**Pengaman:**
1. **Loop hanya jalan di jalur PR** dengan bundle lengkap; tidak pernah di `main` push biasa.
2. **Tidak pernah menimpa commit manusia** — fix masuk sebagai commit terpisah dengan pesan `fix(meerkat): <ringkas>`; reviewer tetap yang merge.
3. **Gagal memperbaiki = temuan** — kalau agent tidak bisa, label `escalated to human`, bukan crash.
4. **Deterministik pada klasifikasi** — klasifikasi (yang menentukan aksi) tidak memakai waktu/RNG; dispatch agent boleh non-deterministik, tapi keputusan *apakah* dispatch = deterministik.

- **F20.1** `[Value]` Verdict `regression` (fixture FIX: run TSI 90, baseline 93; test `SV-TSI-04` gagal) + bundle tersedia → action `dispatch`; agent membaca bundle → commit `fix(meerkat): correct rounding rule` → run ulang → `TSI 93`, check hijau. Komentar PR memuat baris persis `loop: regression → fix proposed → green`.
- **F20.2** `[Value]` **Gate refused:** verdict `refused` (fixture VDT-01) → action `none`, label `refused (not a failure)`; **tidak ada** commit agent, tidak ada dispatch. Baris komentar persis `loop: refused → no action`.
- **F20.3** `[Value]` **Gate incomplete:** rerun tak-lengkap (fixture VDT-02) → action `none`, label `incomplete rerun refused`; baris `loop: incomplete → held`.
- **F20.4** `[Value]` **Gate drift:** `spec-drift` (fixture DRF-01, `SV-COV-07` gagal, ID dihapus dari SPEC) → action `test-update-needed`, **tidak** menyentuh kode; baris `loop: spec-drift → test update needed`.
- **F20.5** `[Edge]` Bundle hilang (`test failure get` exit 3) → action `manual`, label `no bundle — manual loop`; check tetap `neutral`, tidak crash.
- **F20.6** `[Edge]` Agent gagal memperbaiki (rerun masih merah setelah 1 percobaan) → label `escalated to human`, **tidak** retry tanpa batas (maks 1 percobaan), komentar menyebut bundle tetap tersedia.
- **F20.7** `[Value]` **Loop terekam:** halaman Loop (F8.8) menampilkan 1 baris untuk PR fixture dengan kolom `classification=regression`, `action=fix proposed`, `result=green`.
- **F20.8** `[Value]` **Non-gating:** kalau loop tidak bisa jalan (mis. bundle hilang), ratchet tetap `neutral` — loop tidak pernah memaksa merah/hijau sendiri. Gate tetap milik TestSprite + ratchet.
- **F20.9** `[Edge]` Fix agent **tidak** mengubah test atau SPEC (hanya kode aplikasi) — kalau usulan mengubah test, ditolak dengan label `refused: test change proposed`.
- **F20.10** `[Value]` Deterministik pada klasifikasi: input verdict sama → keputusan `dispatch`/`none` + label byte-identik.

### F21 — Preview Environment Matrix (infrastruktur wiring)

Setiap PR dites **di preview deployment-nya sendiri** (bukan prod) lewat Environments TestSprite dengan placeholder per-run, dan (opsi) pada beberapa konteks (auth state × viewport). Ini yang membuat "check fires on every PR" benar-benar menguji perubahan PR itu.

- **F21.1** `[Value]` Run PR mencatat `environment=preview` + URL ter-resolve (mis. `https://meerkat-git-pr-12-team.vercel.app`); run push `main` mencatat `environment=production`. Keduanya dibedakan di dashboard.
- **F21.2** `[Value]` **Matrix konteks:** satu PR dijalankan pada 3 konteks (`desktop-auth`, `mobile-auth`, `desktop-anon`). Dashboard menampilkan 3 baris di bawah satu "PR group" dengan kolom context.
- **F21.3** `[Value]` **Agregasi:** TSI PR group dihitung dari konteks **primer** (`desktop-auth`); kolom `contexts` menampilkan `3/3`; kalau ada konteks gagal → label `1 context failed`, TSI tetap dari primer (transparan, bukan disembunyikan).
- **F21.4** `[Edge]` Preview belum ready saat run diminta → run `status=env-unavailable`, check `neutral`, teks `preview not ready (retry)`; tidak dihitung di stability.
- **F21.5** `[Edge]` Konteks `desktop-anon` tidak butuh auth → tidak memakai Test Account Credentials; dicatat `auth=none` (bukan gagal auth).
- **F21.6** `[Value]` Run detail menampilkan environment + context + URL persis yang dites.

---

## 4. Data model & API

**Tabel:** `users(id, email, password_hash)` · `projects(id, user_id, name, repo, slug, shared, formula_version)` · `runs(id, project_id, sha, pr, branch, total, passed, failed, skipped, status, tsi, formula_version, created_at, environment, context, resolved_url, pr_group_id)` · `artifacts(run_id, junit_xml, spec_md)` · `spec_entries(id, run_id, spec_id, covered, test_name)` · `flake_groups(id, run_id, sha, conflicted, tested)` · `baselines(project_id, branch, tsi)` · `verdicts(id, run_id, classification, reason)` · `failure_bundles(run_id, test_id, snapshot_id, narrative_json)` · `loop_actions(id, pr, run_id, classification, action, result, fix_commit, created_at)`

**API:**

```
POST   /api/runs               # Action kirim hasil (secret header), body: junit + spec snapshot + env/context
GET    /api/runs?project=…     # run list (dikelompokkan per pr_group)
GET    /api/runs/:id           # detail: metrik + coverage + flake + verdict + env
GET    /api/runs/:id/coverage  # 67 baris: ID · status · test
GET    /api/runs/:id/narrative # step narrative dari failure bundle
GET    /api/loop?project=…     # halaman Loop: PR · classification · action · result
POST   /api/loop/classify      # {run_id} → {classification, action, label} (deterministik)
POST   /api/ratchet/check      # {project, sha, tsi} → {pass, baseline, delta}
POST   /api/test/reset         # preview only, secret header
```

**Formula (satu sumber kebenaran `tsi.ts`):**

```
coverage   = covered_ids / total_ids          (0 jika spec kosong → mode renorm)
stability  = 1 − conflicted/tested            (run < 2 → 1.0, label estimated)
pass_rate  = passed / total
TSI        = round(100 × (0.50×coverage + 0.30×stability + 0.20×pass_rate))
```

Deterministik: tidak ada `Date.now()` / RNG di dalam formula. Waktu hanya untuk tampilan.

---

## 5. Integrasi TestSprite (konfigurasi dari docs resmi)

| Setting | Nilai | Sumber |
|---|---|---|
| Action | `TestSprite/testsprite-action@v1` → `test run --all --wait --report junit` | README resmi GitHub TestSprite |
| Outputs dipakai | `passed`, `failed`, `total`, `skipped`, `junit-file` | idem |
| Trigger | PR (Include drafts) + push main | docs GitHub integration |
| Blocking | TestSprite block ON setelah suite stabil; **ratchet = check terpisah** | docs |
| **Preview per-PR** | Environments placeholder: `https://{proj}-git-{branch-slug}-team.vercel.app` (F21) | docs URL pattern / Environments |
| **Failure bundle** | `testsprite test failure get <id> --out <dir>` → input F16 + F20 | docs Test Runs & Reports |
| Fork PR | skip job (tanpa secret) — perilaku resmi action | README action |
| Auth dashboard | Test Account Credentials (bukan OTP/SSO) | docs Authentication |

**Tiga lapis verifikasi (produk ini sendiri):**

1. **Unit + property** — formula TSI (fast-check: coverage/pass/stability selalu ∈ [0,1], TSI ∈ [0,100], deterministik), parser JUnit (XML acak valid → tidak crash, total konsisten), matcher ID, **classifier F20** (deterministik, gate tidak pernah dispatch saat refused/incomplete/drift).
2. **E2E TestSprite** — 96 skenario `SPEC.md` di dashboard + verdict trust + spec drift + **auto-remediation** + **preview matrix** (CLI diuji unit/CLI test; E2E fokus UI).
3. **CLI snapshot** — fixture JUnit+SPEC tetap → JSON byte-identik.

**Budget credit:** aturan **full suite di setiap PR** → dengan fitur v4 (lebih sedikit keluarga) kebutuhannya turun; tetap catat debit nyata dan putuskan Starter $19 hanya kalau terukur perlu — detail `HARI-H.md` §6.

---

## 6. Project Quality bar (40 poin — prioritas kelas satu di v4)

> Di v4, ini **bukan checklist tambahan** — ini 40% skor. App harus beneran enak dipakai oleh reviewer, bukan sekadar jalan.

Checklist (semua ✓ sebelum feature freeze):

- [ ] Token desain di PR 1: tema gelap-devtools, font mono khusus angka (JetBrains/Geist Mono), skala tipografi terkonsep (TSI harus terlihat "instrument")
- [ ] **60 detik pertama**: landing = **kartu skor hidup** + tombol `Lihat run pertama` (tanpa login); reviewer paham "boleh merge nggak?" dalam <10 detik
- [ ] Angka besar utama (TSI) + tabel — **tanpa chart canvas** sebagai pembawa data (chart boleh dekoratif, data di tabel)
- [ ] **Command palette `Cmd+K`** — jumpa run/repo/page (standar app devtools kelas Linear)
- [ ] **Keyboard-first**: tab → row → Enter detail; arrow antar row; Esc back (teruji skenario)
- [ ] **URL state** — filter/branch/sort tertulis di URL; back button berfungsi benar
- [ ] **Virtualized table** — run list tetap halus di 10.000 baris
- [ ] **Motion**: transisi < 200ms, `prefers-reduced-motion` dihormati
- [ ] **Micro-explainability**: hover TSI → tooltip menampilkan rumus + nilai inputnya; SHA punya copy-to-clipboard
- [ ] **Halaman Loop (F8.8)** — cerita loop kebaca dalam 1 layar (classification → action → result)
- [ ] Empty, 404, skeleton (bukan spinner), error boundary **per-panel**, favicon + OG image, route progress bar
- [ ] Responsif (tabel collapse jadi card di mobile)
- [ ] Lighthouse ≥ 90 perf/a11y di preview · axe-core bersih · no console error di alur utama
- [ ] Rate limit `POST /api/runs` · data demo ter-reset tiap deploy preview
- [ ] Uji mata segar 2–3 orang (sebelum submit): bisa jelaskan angka TSI **dan delta terakhir** dalam 60 detik?

**Stack:** TanStack Start (React+TS) · Vercel (preview per-PR) · Postgres (Neon) + Drizzle · Tailwind · Vitest + fast-check · Action pakai TypeScript (composite atau node action).

---

## 7. Suite — 16 keluarga, 96 skenario (58 inti + 38 extended)

Detail per skenario di **`SPEC.md`** (siap upload sebagai PRD detail). Ringkasan:

| Keluarga | # | Fokus | Prioritas |
|---|:---:|---|---|
| SMK | 4 | Landing, API health, CLI hello, share page | inti |
| CFG | 6 | Konfigurasi Action (default, missing key, path salah) | inti |
| ING | 6 | Parse JUnit (counts, skip, malformed, missing, multi-suite) | inti |
| COV | 9 | Traceability (match, gap, case, duplicate, orphan, update, empty, tabel detail) | inti |
| TSI | 8 | Formula (fixture 93, bounds, rounding, determinism, delta) | inti |
| RAT | 6 | Ratchet (drop block, equal, rise, first PR, null, draft) | inti |
| PRM | 5 | Komentar PR (isi, edit-in-place, permission, fork) | inti |
| VDT | 3 | **Verdict trust (refused≠failed, rerun tak-lengkap, diff tanpa verdict)** | inti |
| DRF | 3 | **Spec drift (drift-vs-bug, added/removed, spec-only neutral)** | inti |
| **FIX** | **8** | **Auto-remediation loop (gate per verdict, dispatch, non-gating, record)** | **inti** |
| FLK | 6 | Stability (conflict, same verdict, <2 runs, cross-SHA, rename) | extended |
| DSH | 8 | Dashboard (tabel, detail, history, empty, filter, badge, auth, **halaman Loop**) | extended |
| CLI | 6 | `score` (JSON, deterministik, exit codes, default) | extended |
| NAR | 10 | Step narrative (step 3/5, snapshot guard, fallback, cap 3, edit-in-place) | extended |
| ENV | 4 | Preview matrix (environment, context, agregasi, env-unavailable) | extended |
| ERR | 4 | Malformed, network fail, unauthorized, zero-tests | extended |
| **Total** | **96** | **58 inti + 38 extended** | |

---

## 8. Test-data & environment

| Item | Nilai |
|---|---|
| Akun test | `demo@suitevitals.dev` / `demo-password-1` (Test Account Credentials) |
| Fixture | `fixtures/junit/67t.xml` (64/3/0), `fixtures/junit/flaky.xml` (SHA-A 2 run), `fixtures/SPEC.md` (67 ID), `fixtures/bundle/step-fail/` (5 step, step 3 fail, `snapshotId snp_A1`), `fixtures/verdicts.md` (refused / incomplete / drift / regression) |
| Data demo | 2 project (10 + 3 run history, TSI 88→93, satu flake conflict, satu gap, **satu PR loop regression→fix→green**) — ter-seed tiap deploy preview |
| Reset | `POST /api/test/reset` preview only |
| Concurrency | 1 (DB preview shared) |

---

## 9. Opsi yang ditolak (dan kenapa)

- **F11 attribution (waterfall), F12–F13 replay, F17 kill rate** → **dipotong di v4.0.** Riset 13 Okt: waterfall decomposition dan replay = prior art umum; kill rate = *mutation testing*, konsep sejak DeMillo dkk. 1978, dan CI-enforced mutation gate sudah ada (Stryker/SonarQube). Menambahkannya bikin project terlihat "nyalin Datadog/mutation testing" tanpa menambah poin rubrik. (Sebelumnya F17 dipertahankan dengan 4 pengaman — kini dibuang total.)
- **F14 badge, F15 impact select** → dipotong: badge = stretch low-value; impact select = *Test Impact Analysis* (Datadog). Karena gate tetap full-suite tiap PR (rubrik "fires on every PR"), tidak ada kebutuhan memilih subset.
- **Chart-heavy dashboard** → ditolak: assertion chart lemah di E2E; data di tabel.
- **Assertion-depth parsing dari source test** → ditolak: test source TestSprite tidak dijamin bisa diakses dari repo. Coverage pakai ID mapping (kontrak yang bisa diuji).
- **Auto-fix tanpa gate** → ditolak: memperbaiki kode saat verdict `refused`/`incomplete`/`drift` = bug. Gate F18/F19 → F20 adalah produknya.

## 10. Open questions

1. ~~Nama final~~ **SELESAI 12 Okt: Meerkat** — sentinel yang berdiri tegak mengawasi koloni. Slug/repo `meerkat`, live `meerkat.vercel.app`. Identifier teknis tetap `suitevitals`/`SV-`.
2. **Bagaimana F20 dispatch agent?** Pilihan: (a) step Action lanjutan yang memanggil coding-agent CLI (mis. Claude Code / Codex headless) dengan bundle sebagai input; (b) MCP server. Keputusan saat window; default = (a) karena paling terlihat di thread PR. Verifikasi eksperimen di `RUNBOOK.md` §3.
3. **Berapa konteks matrix F21** yang cukup? Default 3 (`desktop-auth`, `mobile-auth`, `desktop-anon`); turunkan ke 1 kalau credit terbatas — dicatat di README sebagai keputusan sadar.
4. Apakah `testsprite-action` mengijinkan run suite 2× dalam satu workflow (untuk stability data) → cek saat setup; kalau tidak, stability pakai history run per SHA (re-run job manual).

---

## 11. Side-quest: CLI bonus $1.000 (terpisah dari $3.000 proyek)

Halaman resmi S4: hadiah **$4.000 = $3.000 proyek + $1.000 CLI bonus**, terpisah. Mekanik: entry via **checkbox "I'm entering this PR for the Season 4 CLI Improvement Bonus" di PR template + username Discord + bot konfirmasi**; klaim issue di `TestSprite/testsprite-cli` (komentar "claiming"), maks **3** klaim, **48 jam** tanpa aktivitas = warning, **72 jam** = klaim dilepas, PR harus **menutup issue** (`Fixes #N`) + memuat test, bot konfirmasi eligibility, maks 3 PR eligible, PR harus open & out-of-draft sebelum **29 Okt 23:59 PT**. *"Agents screen, a human decides"* — judges nilai Impact, Problem Definition, Craft, Discipline.

**Kandidat issue (cek status klaim saat window buka, urutan preferensi):**

| Issue | Judul | Alasan cocok |
|---|---|---|
| #375 | Flaky refusal di-skor sebagai failure | Bug perilaku nyata, deterministik, punya fixture jelas |
| #378 | `test diff` membandingkan run tanpa verdict | Scope kecil, high-value untuk agent loop |
| #369/#365 | Lebar kolom CJK | Fallback kalau dua di atas sudah di-claim — UX nyata, testable |

**Strategi waktu:** klaim saat window dibuka — slot pertama menentukan. Bangun PR **setelah submit proyek (22 Okt)**, sisakan buffer sebelum 29 Okt. Jangan sentuh #358/#359 (god-module split / parallel execution) — scope terlalu besar.

---

*PRD ini menyertai `SPEC.md` (96 skenario), `HARI-H.md` (runbook), `INTEGRATION.md` (diferensiasi), `README.md` (sampul).*
