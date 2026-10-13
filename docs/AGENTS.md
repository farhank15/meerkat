# AGENTS.md — Handoff untuk agent AI eksekutor

Repo ini **siap dijalankan agent lain** (Claude Code, Codex, dll). File ini titik masuknya.

## Konteks 1 kalimat

Meerkat — entri TestSprite Hackathon S4 (window **16–22 Okt 2026**, submit 22 Okt 23:59 PT): dashboard yang dipoles (app quality) + TestSprite terpasang dalam (tiap PR dites di preview-nya sendiri) + **loop auto-remediation yang di-gate verdict trust** (headline). Nama produk **Meerkat**; identifier teknis tetap `suitevitals`/`SV-`. Semua dokumen **final v4.0** — pekerjaan di window = **eksekusi, bukan redesign**.

## Urutan baca (wajib)

1. [`PREFLIGHT.md`](PREFLIGHT.md) — §3 briefing, §1 status akun (tabel ❌ = fase itu belum jalan).
2. [`RUNBOOK.md`](RUNBOOK.md) — ikuti §0→§8 **berurutan**, jangan lompat. Kredensial: [`SECRETS.md`](SECRETS.md).
3. [`PRD.md`](PRD.md) · [`SPEC.md`](SPEC.md) — apa & kenapa. **Jangan ubah angka pasti di SPEC/README/fixture** tanpa mengubah ketiganya bersamaan.
4. [`INTEGRATION.md`](INTEGRATION.md) — §0 reframe v4 (kenapa fitur prior-art dipotong) + §3 prior art yang **tidak** kami tiru. **Setiap klaim inovasi di README/video wajib menunjuk ke sini, bukan mengarang.**
5. [`TRIAL.md`](TRIAL.md) — hasil trial 12 Okt (bukti mekanik + gotcha).
6. [`HARI-H.md`](HARI-H.md) (strategi/budget/cut rules) · [`VIDEO.md`](VIDEO.md) (kapan rekam footage).

## Aturan tidak boleh dilanggar

1. **Gate PR = full suite** tiap push (rubrik: *"fires on every PR"*).
2. **Loop tidak pernah memalsukan kegagalan** dan **tidak pernah mengubah test/SPEC** — hanya kode aplikasi (FIX-08).
3. **Jangan auto-fix kalau verdict tidak jujur:** `refused`, rerun tak-lengkap, atau `spec-drift` → loop **DIAM**, tidak menyentuh kode (FIX-02/03/04). Ini produknya.
4. **Satu concern = satu PR.** Kalau kepepet, potong sesuai urutan RUNBOOK §6 — jangan pernah potong "check fires on every PR".
5. Email TestSprite = email submission; repo publik; live URL tetap hidup selama window.
6. Setiap perintah yang butuh **akun, API key, atau jawaban Discord → tanya manusia**; jangan mengarang kredensial.
7. **Jangan klaim "novel" untuk mutation testing / flaky detection / test impact analysis** — itu prior art (INTEGRATION §3).

## Misi pertama — tergantung tanggal hari ini

- **Sebelum 16 Okt:** RUNBOOK §0 (cek halaman S4 + Discord) → §1 Fase A (kategori A1–A7 PREFLIGHT §2). **Berhenti sebelum** menyentuh run TestSprite, kecuali manusia menyebut Discord sudah mengizinkan pra-window.
- **16 Okt atau sesudahnya:** RUNBOOK §0 **dulu** (klaim issue CLI di menit pertama, catat jamnya) → lanjut §1→§5 berurutan.

## Prompt pendek — tempel ke agent baru

```text
Baca AGENTS.md, lalu PREFLIGHT.md §3, di repo ini. Kamu agent eksekutor untuk
TestSprite Hackathon S4 — semua keputusan sudah final (v4.0), tugasmu EKSEKUSI,
bukan redesign. Ikuti RUNBOOK.md dari §0 sesuai tanggal hari ini, berurutan,
jangan lompat. Tulis semua hasil uji/eksperimen di log repo submission
(format: TRIAL.md, apa adanya).
Jangan ubah angka pasti di SPEC/README/fixture tanpa update ketiganya bersamaan.
Gate PR = full suite. Loop hanya boleh menyentuh kode saat verdict = regression
asli dengan bundle; refused/incomplete/spec-drift = loop DIAM. Berhenti dan tanya
saya sebelum setiap langkah yang butuh akun, API key, atau jawaban Discord.
```
