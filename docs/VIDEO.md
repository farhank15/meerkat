# VIDEO.md — Shot list + voice-over (demo S4)

Dua deliverable:

1. **Video utama 60–90 detik** — untuk submission. S4: *demo video optional, tapi "Judges do watch them"*. Link di Discord `#hackathon-submissions` + di README.
2. **B-roll selama build** — direkam **sekali** saat kerja nyata (HARI-H §7: *rekam sekali, jangan remake*).

> **v4:** video sekarang **dipimpin oleh loop** (merah → klasifikasi → agent fix → hijau), bukan kill rate (fitur dipotong). Momen kunci: **loop DIAM saat verdict tidak layak dipercaya**.

---

## Aturan rekam

- Layar penuh **1080p**, Chrome, zoom 100%, tab lain ditutup, notifikasi OFF (macOS: `Cmd+Shift+5` → Entire Screen).
- **VO bahasa Inggris** (juri internasional), ±150 wpm → 90 detik ≈ **±210 kata**. Rekam VO terpisah dari layar; retake per kalimat.
- **Subtitle burn-in** — banyak penonton nonton tanpa suara.
- Semua angka di VO harus angka **asli** dari dashboard/run saat itu — jangan ada satu pun angka hafalan.
- Cek frame tidak memuat API key / token sebelum upload.
- Mentah footage: simpan lokal/Drive — **jangan** di-commit ke repo.

---

## Shot list — video utama (target ±90 detik)

| # | Durasi | Footage — aksi persis yang direkam | Voice-over (verbatim) | On-screen text |
|---|---|---|---|---|
| 1 | 0:00–0:08 | Klik PR → tab **Checks** yang lagi **merah** → zoom ke anotasi `::error::` | *Your suite is green. But is it meaningful?* | `green ≠ meaningful` |
| 2 | 0:08–0:22 | Landing prod (tanpa login) → klik ke **run detail**: TSI **93**, coverage, stability, pass rate | *TestSprite gives you a verdict on every PR. Meerkat adds the trust layer on top — whether that green means anything, with every number reproducible from files on disk.* | `TSI 93 = f(junit, SPEC.md)` |
| 3 | 0:22–0:38 | PR comment bot muncul → zoom ke baris `TSI 90 (Δ −3 vs main 93)` + klasifikasi `regression` | *Yesterday the check went red — and it was right. A rounding bug. The comment doesn't just say "failed" — it classifies the verdict first.* | `Δ = −3 · regression` |
| 4 | 0:38–0:55 | Agent baca **failure bundle** (`failed at step 3/5 · expected 95, received 96`) → commit `fix(meerkat)` → `git push` → run **re-run otomatis** → hijau → **merge** | *Meerkat hands the failure bundle to an agent, which fixes the root cause and pushes. The check reruns itself. Green. That's the loop — closing on its own.* | `red → fix → green · loop` |
| 5 | 0:55–1:10 | Buka PR lain → check merah tapi berlabel **`refused (not a failure)`** → komentar `loop: refused → no action` → **tidak ada commit** | *But here's the point. This red is a refused verdict — not a real failure. And Meerkat does nothing. It never touches your code unless the verdict is honest.* | `refused → no action` |
| 6 | 1:10–1:22 | Run detail → kolom **environment**: `preview` + URL `…-git-pr-12-…vercel.app` (bukan prod) | *And every pull request is tested on its own preview deployment — not production. Three contexts, one per PR.* | `preview · per-PR · 3 contexts` |
| 7 | 1:22–1:35 | Terminal: `npx suitevitals score …` → JSON → bandingkan angka dengan dashboard; README (96 skenario) → link live + repo | *Same numbers, locally, byte-identical. Meerkat — 96 scenarios, one formula, one ratchet, and a loop that knows when to stay still. Built for TestSprite Hackathon Season Four.* | `meerkat.vercel.app · github` |

---

## Momen capture SELAMA build (kapan tekan record)

Rekam saat kerja nyata berlangsung — jangan rekam ulang dari nanti. Total: ±8 file mentah.

| # | Momen | Kapan | Dipakai di scene |
|---|---|---|---|
| C1 | **PR pertama merah → hijau** (bug nyata) | push pertama yang kena bug | 1, 3, 4 |
| C2 | Run detail pertama muncul (TSI) | saat TSI jadi | 2 |
| C3 | PR comment bot muncul (record dari komentar datang, bukan screenshot) | PR pertama dengan F7 | 3 |
| C4 | Ratchet memblokir merge pertama kali | PR #3–#4 (blocking ON) | 4 |
| C5 | **Loop auto-fix pertama** (bundle → agent commit → hijau) | PR #6 (FIX) | 4 |
| C6 | **Loop DIAM saat refused/drift** (tidak ada commit) | kapan saja setelah F18/FIX | 5 |
| C7 | Run di preview URL (kolom env) | PR #1 (F21) | 6 |
| C8 | CLI score byte-identik | gerbang RUNBOOK §4 | 7 |

**Rekam satu file mentah per momen, minimal 30 detik lebih panjang dari yang dipakai.**

---

## Naskah VO utuh (buat rekaman — ±210 kata, ±85 detik)

> Your suite is green. But is it meaningful?
>
> TestSprite gives you a verdict on every pull request. Meerkat adds the layer on top — whether that green actually means anything, with every number reproducible from files on disk.
>
> This is the app: ninety-six scenarios with exact expected values, running against the live deployment on every pull request — on the pull request's own preview, not production.
>
> Yesterday the check went red — and it was right. A rounding bug: expected ninety-five, received ninety-six. The comment doesn't just say "failed" — it classifies the verdict first. Then Meerkat hands the failure bundle to an agent, which fixes the root cause and pushes the fix. The check reruns itself. Green. That's the loop, closing on its own.
>
> But here's the point. Another check goes red — and this time it's a refused verdict, not a real failure. Meerkat does nothing. It never touches your code unless the verdict is honest. And a spec drift? It updates the test, not the code.
>
> Same numbers, locally, byte-identical — because the formula is deterministic and every input is in the repo.
>
> Meerkat. Your suite is green — but is it meaningful? Built for TestSprite Hackathon Season Four.

---

## Checklist sebelum submit

- [ ] Durasi final **60–90 detik** (boleh versi pendek 60 dulu, potong scene 6–7 kalau kepepet)
- [ ] Subtitle burn-in, VO jelas, musik di bawah VO
- [ ] Semua angka di frame/VO = angka asli saat itu
- [ ] Tidak ada API key/token yang kebaca di frame
- [ ] Upload (YouTube unlisted / Drive) → link dimasukkan di: (a) Discord submission, (b) README baris *Demo video*
- [ ] Mentah footage tidak ikut ter-commit
