# PREFLIGHT — Status kesiapan, uji coba, briefing agent eksekutor

> **File ini HIDUP — diisi selama masa persiapan sebelum hari-H.** [`RUNBOOK.md`](RUNBOOK.md) = instruksi (apa & bagaimana); file ini = **bukti kesiapan** (sudah dicoba atau belum, hasilnya apa).
>
> **Kalau kamu AI agent yang bangun di hari H: baca §3 dulu, lalu ikuti RUNBOOK dari §0.**

---

## 1 · Status akun & infra (isi saat juga)

Kondisi jujur per **13 Okt (pasca-reframe v4, bukti: `TRIAL.md`)**: trial mekanik di repo latihan `farhank15/test1` (sudah dihapus) selesai — akun, CLI, Node, live URL, Action→JUnit, E1, debit credit semua terverifikasi. Reframe v4 (13 Okt) memotong fitur prior-art dan menambah F20/F21 — lihat `INTEGRATION.md` §0. Yang tersisa = tugas manusia di bawah.

| # | Item | Status (isi: ❌ belum / ✅ sudah) | Kapan buat | Bukti (isi saat juga) |
|---|---|---|---|---|
| 1 | Akun TestSprite — **Free**, catat kuota credit/bulan yang tertulis di portal | ✅ (trial) | 12 Okt | akun ada · kuota tertulis: **150/bulan** · trial makan 54, sisa 96 |
| 2 | Akun GitHub + repo **publik** `meerkat` | ⏳ trial ✅, submission ❌ | hari-H | trial `test1` (push/PR/Action OK, sudah dihapus); repo submission dibuat di window |
| 3 | Akun Vercel (Hobby free) — login CLI: `npx vercel login` | ✅ (trial) | 12 Okt | login OK, deploy prod+preview OK (Vercel CLI 63.1.2) |
| 4 | Discord: sudah **join + role S4** + follow @TestSprite | ❌ | 12–13 Okt | screenshot |
| 5 | Neon DB (Free) — baru dibutuhkan saat build backend | ❌ | hari-H | — |
| 6 | **DNS/domain sendiri** | **Tidak perlu** — pakai `*.vercel.app` | — | — |
| 7 | Jawaban 4 pertanyaan `#hackathon-qa` (pra-window, credit, eligibility) | ❌ | 12–13 Okt | link thread: `____` |
| 8 | **Dispatch agent (F20)** — coding-agent CLI headless bisa dipanggil dari workflow | ❌ | hari-H (E5) | — |
| 9 | **Preview env per-PR (F21)** — placeholder URL TestSprite resolve ke preview PR | ❌ | hari-H (E6) | — |
| 10 | **Secrets terpasang** (A5): `TESTSPRITE_API_KEY`, `SUITEVITALS_API_KEY`, `DATABASE_URL`, `AGENT_API_KEY` | ❌ | hari-H (A5) | `gh secret list` — lihat [`SECRETS.md`](SECRETS.md) |
| 11 | **Branch protection** `main` → require `testsprite-dev` + `SuiteVitals Ratchet` | ❌ | hari-H (Fase B-8) | screenshot rule |

> **Soal "akun free cukup nggak?":** kuota tertulis di portal-lah yang berlaku, bukan angka dokumen. v4 punya fitur lebih sedikit dari v3.2 → kebutuhan credit turun (~155). Kalau beda dari 150, HARI-H §6 dan keputusan Starter $19 ikut ditinjau.

---

## 2 · Uji coba (dry-run) — apa yang perlu & kapan

**Prinsip:** ~90% "slop" di hari H datang dari *tooling yang belum pernah dipakai*, bukan dari strategi. Semua yang **tidak menyentuh TestSprite** wajib dicoba jauh sebelum H.

### Kategori A — boleh sekarang (±2,5 jam, tanpa TestSprite)

| # | Uji | Perintah | Tanda lolos |
|---|---|---|---|
| A1 | Scaffold + merge ke repo ini | `npm create tanstack-start@latest tmp-scaffold` → rsync (RUNBOOK §1 A1) → `npm run dev` | `localhost:3000` hidup, dokumen lama tidak tertimpa |
| A2 | Git remote + push | `gh auth status` → `gh repo create meerkat --public --source . --push` | commit terakhir ada di GitHub |
| A3 | Deploy kering | `npx vercel login` → `npx vercel --prod` | URL prod membuka landing |
| A4 | Versi Node cocok | `node -v` | ≥ 20.19 / 22.13 / 24 (syarat testsprite-cli) |
| A5 | CLI TestSprite terpasang | `npm i -g @testsprite/testsprite-cli && testsprite --version` | versi tercetak |
| A6 | Workflow YAML valid | push `.github/workflows/testsprite.yml` (RUNBOOK §4) ke branch percobaan | Actions tidak error parse |
| A7 | **Dispatch agent kering (F20)** | panggil coding-agent CLI headless dengan input bundle dummy → hasilkan patch di repo percobaan | patch ter-generate dari bundle contoh |
| A8 | **Secrets + env vars (A5)** | `gh secret set …` (4 secret) + `vercel env add DATABASE_URL` + `.env.local` masuk `.gitignore` | `gh secret list` muncul 4 nama; `vercel env ls` OK |

> **Bisa sekarang vs hari-H** (jawaban "apa yang bisa disiapkan lebih dulu?"): **akun, repo, scaffold, deploy, secrets, workflow YAML, dispatch-agent kering = boleh sekarang** (nggak menyentuh TestSprite). **Project TestSprite, Environments, eksperimen E1/E2/E4/E5/E6 = cek Discord dulu.** **Klaim issue CLI, plan generation/suite run, PR dengan check, build fitur = wajib ≥16 Okt.**
> **Caveat:** PRD §10 open question #3 ("kode pra-16 Okt dihitung?") belum terjawab → tanya `#hackathon-qa`. Aturan aman sampai jelas: **infra boleh sekarang, "karya hackathon"-nya tunggu window.**
> **Branch protection** (Fase B-8) lebih mudah setelah check pertama muncul (nama check belum ada sebelum run pertama) → praktisnya hari-H.

### Kategori B — butuh izin jawaban Discord (masa persiapan)

Portal wiring (RUNBOOK §2) + **E1/E2/E4/E5/E6** (RUNBOOK §3) + ukur debit credit pertama. Kalau Discord bilang pra-window dilarang → geser seluruhnya ke awal hari-H, dan kerjakan **E1/E2 dari dokumentasi dulu** (tanpa run).

### Kategori C — hanya ≥ 16 Okt

Klaim issue CLI · plan generation suite utama · trigger PR dengan run asli · blocking ON · **loop auto-remediation pertama**.

### Hasil uji coba

Hasil trial 12 Okt ada di [`TRIAL.md`](TRIAL.md) (Kategori A 6/6 **saat itu** — A1–A6; **A7 ditambahkan di v4** + E1 + gerbang parsial + debit 54). Reframe v4 (13 Okt) menambah A7 + E5/E6 dan menghapus E3 (kill rate). Tabel di atas tetap sebagai rencana & tanda lolos untuk repo submission.

---

## 3 · Briefing untuk AI agent eksekutor (baca ini dulu)

> Repo ini diserahkan ke agent lain? Titik masuk resmi + prompt siap tempel ada di [`AGENTS.md`](AGENTS.md).

**Konteks dalam 3 kalimat.** Hackathon TestSprite S4 (16–22 Okt, submit 22 Okt 23:59 PT) membutuhkan repo publik dengan suite TestSprite yang jalan di setiap PR. Kita membangun **Meerkat**: dashboard yang dipoles (app quality 40) + TestSprite terpasang dalam (tiap PR dites di preview-nya sendiri, suite 96 skenario, ratchet menahan merge — 40) + **loop auto-remediation yang di-gate verdict trust** (refused/incomplete/drift → diam; regression + bundle → agent perbaiki — 20). Semua dokumen sudah final v4.0; pekerjaan di window = **eksekusi, bukan desain ulang**.

**Urutan baca:** `PREFLIGHT.md` (status ini) → `RUNBOOK.md` (langkah 0→8) → `PRD.md` (apa & kenapa) → `SPEC.md` (96 skenario, nilai pasti) → `INTEGRATION.md` (diferensiasi + bukti riset + reframe) → `HARI-H.md` (strategi, budget, cut rules) → `VIDEO.md` (kapan rekam).

**Aturan keras — jangan dilanggar:**

1. **Gate PR = full suite** tiap push (rubrik: *"fires on every PR"*).
2. **Loop tidak pernah memalsukan kegagalan** dan **tidak pernah mengubah test/SPEC** — hanya kode aplikasi.
3. **Jangan auto-fix kalau verdict tidak jujur:** refused / rerun tak-lengkap / spec-drift → loop **DIAM** (FIX-02/03/04).
4. **Jangan ubah angka di `SPEC.md`/fixture/README** tanpa mengubah ketiganya bersamaan.
5. Email TestSprite = email submission. Repo publik, live URL tetap hidup selama window.
6. Satu concern = satu PR; urutan potong kalau kepepet: RUNBOOK §6 (jangan potong "check fires on every PR").
7. **Jangan klaim "novel" untuk mutation testing / flaky detection / TIA** — prior art.

**Kalau terjepit:** tabel keputusan RUNBOOK §7 — bukan improvisasi.

**Keputusan yang sudah final (jangan dibuka lagi):** Meerkat v4.0 · nama produk Meerkat, identifier teknis tetap `suitevitals`/`SV-` · 96 skenario/16 keluarga (58 inti + 38 extended) · headline = **loop auto-remediation ber-gate verdict** (F20) dengan verdict-trust (F18) + spec-drift (F19) sebagai gerbang · preview matrix per-PR (F21) · fitur dipotong: F11 attribution, F12–F13 replay, F14 badge, F15 impact select, F17 kill rate · full-run-per-PR · core-first priority.

---

## 4 · Gerbang sebelum H (tanda centang terakhir — sebelum window dibuka)

- [ ] Kategori A (A1–A7) **semua lolos** dan hasilnya di tabel §2
- [ ] Kategori B selesai **atau** jawaban Discord sudah jelas kapan boleh
- [ ] Gerbang JUnit RUNBOOK §4 terbukti (JUnit artifact → `suitevitals score` = hitungan manual)
- [ ] **5 secret terpasang** (RUNBOOK A5) + **branch protection aktif** (RUNBOOK Fase B-8)
- [ ] Baris §1 semua ✅ dengan bukti terisi
- [ ] README: link PR contoh & video masih kosong = **normal** (diisi di window)
