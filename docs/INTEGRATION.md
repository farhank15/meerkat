# INTEGRATION — Diferensiasi & fondasi riset (dokumen inovasi)

> Dokumen ini = jawaban "apa yang orisinal?" dan "apa yang **tidak** kami kerjakan karena sudah jadi prior art?"
> Thesis satu kalimat: **TestSprite memberi verdict-nya; Meerkat menambah lapisan kepercayaan di atasnya, dan hanya menutup loop-nya saat verdict itu jujur.**

---

## 0 · Reframe v4 (keputusan 13 Okt 2026)

**Yang berubah dari v3.2 → v4.0:**

| | v3.2 (lama) | v4.0 (sekarang) |
|---|---|---|
| Bintang produk | "tool yang mengaudit TestSprite" (7 lapis) | **app + wiring + loop** — dashboard yang dipoles, terpasang dalam, dan menutup loop-nya |
| Headline inovasi | verdict-trust (F18) | **auto-remediation loop yang di-gate verdict** (F20) — F18/F19 jadi gerbangnya, bukan tujuan akhir |
| Fitur dipotong | — | F11 attribution · F12–F13 replay · F14 badge · F15 impact select · **F17 kill rate** |
| Fitur baru | — | **F20 auto-remediation** (headline) · **F21 preview matrix** (infrastruktur) |
| Suite | 116 skenario / 18 keluarga | **96 skenario / 16 keluarga** |

**Kenapa dipotong — bukan soal waktu, soal fokus rubrik.** Rubrik S4: **40 app quality + 40 tests-run-themselves + 20 innovation.** Artinya 80 dari 100 poin bukan soal "ide baru" — soal **app yang beneran jalan** dan **suite/wiring yang beneran dalam**. Fitur yang cuma menambah permukaan tanpa menambah poin justru melemahkan cerita. Riset 13 Okt (deep-research, 20 sumber terverifikasi) mengonfirmasi fitur yang dipotong itu **prior art**:

| Fitur yang dipotong | Prior art |
|---|---|
| F17 kill rate | **Mutation testing** — konsep sejak DeMillo dkk. **1978**; "kill rate" = mutation score. Stryker/SonarQube sudah fail-pipeline saat skor turun |
| F11 attribution (waterfall) | Dekomposisi delta = aritmetika biasa, bukan pembeda |
| F12–F13 replay/verify | Replay deterministik = praktik umum |
| F15 impact select | = **Test Impact Analysis** (Datadog sudah ship) |
| (flaky detection, kalau dipromosikan) | **DeFlaker** (Bell dkk., ICSE 2018), iDFlakies, FlakeFlagger — mature |

**Konsekuensi yang jujur:** mekanisme Meerkat sebagian besar bukan hal baru — dan itu **tidak masalah**. Yang belum ada yang lakuin adalah **kombinasi + gate**: mengaudit verdict (refused≠failed, incomplete, drift) lalu **menggunakan audit itu untuk memutuskan apakah agent boleh memperbaiki kode**. Itu F20.

---

## 1 · Tiga pilar (pengganti "7 lapis")

| Pilar | Rubrik | Yang dibangun | Bukti untuk juri |
|---|---|---|---|
| **1 · App** | Project quality · 40 | Dashboard Meerkat: landing kartu skor hidup, run detail, halaman Loop, command palette, keyboard-first, responsif — kelas devtools (Linear/Vercel) | Live URL, screenshot, Lighthouse ≥ 90, uji mata segar |
| **2 · Wiring** | Tests that run themselves · 40 | `testsprite-action@v1` full-suite tiap PR, **di preview URL PR itu sendiri** (F21), ratchet menahan merge, 96 skenario bernilai pasti, kontrak nama `SV-` | Workflow YAML + check hijau di setiap PR + 3.0 portal |
| **3 · Loop** | Innovation · 20 | **Verdict audit → auto-remediation** (F18/F19 → F20): refused/incomplete/drift = jangan sentuh; regression asli + bundle = agent perbaiki → hijau | PR merah→hijau yang loop-nya nutup sendiri + halaman Loop |

Pilar 1–2 = apa yang 80% peserta lain juga kejar (dan yang paling menentukan skor). Pilar 3 = satu-satunya tempat kami berbeda.

---

## 2 · Fondasi riset — bukti yang MENDUKUNG masalah (terverifikasi 13 Okt)

| # | Temuan | Sumber | Confidence |
|---|---|---|---|
| R1 | Dari 1.000 unit test ChatGPT: **42,1% compile, hanya 24,8% jalan tanpa error**, ~17% lolos tapi assertion salah | Yuan dkk., FSE 2024 (arXiv:2305.04207) | tinggi (3-0) |
| R2 | Coverage cuma berkorelasi **lemah–sedang** dengan kemampuan suite menangkap bug (setelah ukuran suite dikontrol); *"should not be used as a quality target"* | Inozemtseva & Holmes, ICSE 2014 | tinggi (3-0) |
| R3 | Untuk suite hasil-LLM di kode yang **mungkin buggy**, korelasi coverage–deteksi **lemah seragam** | Zhao, Zhou & Cohen, ISSTA 2026 (arXiv:2607.22880) | tinggi (3-0) |
| R4 | Rasio flaky yang tinggi **mengikis kepercayaan** dev: berhenti peduli, anggap flake, retry manual | Datadog Test Health docs (verbatim) | tinggi (3-0) |
| R5 | Refusal di-skor failure; rerun tak-lengkap exit 0; diff run tanpa verdict | issue `testsprite-cli` #375 / #380 / #378 | (primer) |

**R1–R3** → membenarkan TSI (coverage saja tidak cukup → tambah stability + pass + **verdict audit**). **R4** → membenarkan fokus trust. **R5** → membenarkan F18 dan **gerbang F20**.

### Klaim yang kami TOLAK (kejujuran riset)

Deep-research memverifikasi 93 klaim, **19 dikonfirmasi, 6 ditolak** — termasuk beberapa benchmark flaky yang salah kutip di sumber sekunder (DeFlaker recall sebenarnya ~95,5%, bukan 61%). **Aturan: jangan kutip angka dari blog sekunder; setiap angka di README/video harus bisa direproduksi sendiri** (dari fixture repo ini).

---

## 3 · Prior art yang sengaja TIDAK kami tiru

Kesimpulan riset: hampir semua mekanisme "meta-tooling" sudah komoditas. Menambahkannya = kelihatan menyalin, tanpa menambah poin. Jadi kami **drop**:

- **Mutation testing / kill rate** (DeMillo 1978; Stryker, SonarQube, Microsoft) → dibuang total.
- **Test Impact Analysis** (Datadog) → dibuang; gate tetap full-suite (rubrik: *"fires on every PR"*).
- **Flaky detection sebagai fitur** (DeFlaker, iDFlakies) → stability tetap ada **sebagai komponen TSI**, bukan dipromosikan jadi fitur tersendiri.
- **Quality gates / PR ratchet** (Datadog PR Gates) → kami tetap punya ratchet, tapi **tidak** mengklaimnya sebagai inovasi; ia infrastruktur.

Yang **bukan** prior art dan jadi inti kami: **audit verdict sebagai gerbang aksi**. Tidak ada produk/tool yang, dari sisi konsumen, menolak verdict `refused`/`incomplete`/`drift` **lalu memutuskan tidak memperbaiki kode**.

---

## 4 · Peta diferensiasi (cek: tidak tabrakan)

| Pihak | Posisi mereka | Posisi kami | Status |
|---|---|---|---|
| Datadog Test Optimization | Flaky detection, coverage, TIA, quality gates — metrik **terpisah**, bukan satu skor komposit; gate dari coverage/flaky | Skor komposit (TSI) + **audit verdict → aksi** | Tidak mengulang; sudut beda (verdict-trust, bukan observability) |
| Mutation tools (Stryker/SonarQube) | Mutasi source-level, gate skor | Tidak menyentuh; kami bukan mutation tool | Sengaja tidak bersaing |
| Mantiz (S3) | Lie detector: blokir agent yang **curang** | Suite yang **jujur tapi lemah** + verdict tak-berverdict | Sisi berlawanan masalah yang sama — komplementer |
| Ouroboros (S3) | Dashboard narasi loop build-nya | Dashboard **mutu suite + loop perbaikan ber-gate** | Objek ukur beda |
| CLI `test flaky` (built-in) | Replay per-test + stability score | Naik satu level: mutu **seluruh suite** + audit verdict + **aksi otomatis ber-gate** | Tidak mengulang fitur resmi |

---

## 5 · Narasi submission (dipakai di README + Discord)

- Satu kalimat: *"TestSprite gives you the verdict. Meerkat adds the trust layer on top — and closes the loop only when the verdict is honest."*
- Tiga peluru: (1) menolak verdict tak-berverdict (VDT), (2) membedakan spec-drift dari bug (DRF), (3) **loop yang memperbaiki regresi sendiri — tapi tidak pernah menyentuh kode saat verdict tidak layak dipercaya** (FIX).
- Bukti, bukan adjektif: setiap peluru menunjuk ke PR/run/angka.

---

## 6 · Checklist anti-common (sebelum submit, semua harus ✓)

- [ ] Ada ≥1 PR merah→hijau asli dengan **loop auto-remediation** (bukan drama) — link di README
- [ ] Komentar PR memuat baris ringkasan persis `TSI 93 (Δ −3 vs main 96)` (format PRM-01)
- [ ] Dashboard publik menunjukkan klasifikasi `refused (not a failure)` dan `spec-drift` pada data nyata
- [ ] Halaman Loop menunjukkan minimal 3 klasifikasi berbeda (regression→fix, refused→no action, drift→test update)
- [ ] Setiap PR dites di **preview URL-nya sendiri** (bukan prod) — terlihat di kolom env
- [ ] Tidak ada klaim tanpa angka di README (setiap adjektif menunjuk ke skenario `SV-`/`VDT`/`DRF`/`FIX`)
- [ ] Tidak ada klaim "novel" untuk mutation testing / flaky detection / TIA (sudah prior art — sebut jujur kalau disinggung)
