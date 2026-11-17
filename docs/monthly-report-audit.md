# Monthly Report Generator: Audit dan Pemetaan Data (Phase 1)

Tanggal audit: 17 November 2026. Sumber: kode di `src/` (commit `1fcf113`) dan PDF acuan
"Marketing Department Monthly Report July 2026" (14 lembar, 27 halaman bernomor).

## 1. Temuan utama

1. **Dashboard tidak punya backend, database, atau API.** Aplikasi ini React + Vite statis
   (GitHub Pages). Tidak ada `fetch`, tidak ada variabel `VITE_*`, tidak ada layanan penyimpanan.
   Tombol "Source: Google Sheets" di header dan "Connect spreadsheet" di Promoter belum terhubung
   ke apa pun.
2. **Semua angka di dashboard adalah konstanta di kode atau data demo.** Yang bisa diubah pengguna
   hanya tersimpan di `localStorage` browser masing-masing (tidak terbagi antar perangkat).
3. **Angka per bulan bukan data historis.** Marketing Performance hanya punya angka satu bulan
   acuan (November 2026); bulan lain dihitung dengan faktor (`getPeriodFactor`,
   `getDemoPeriodValue`). Social Media hanya punya angka Oktober 2026; Jan–Sep dibuat dengan
   fungsi gelombang (`buildWaveSeries`).
4. **Dokumentasi visual tidak ada di dashboard.** Aset gambar hanya 9 foto anggota tim dan logo
   (`src/assets/images`). Tidak ada thumbnail konten, screenshot akun, foto kegiatan, materi iklan,
   atau metadata tanggal/kategori untuk gambar.
5. **Angka dashboard tidak sama dengan PDF Juli 2026.** Contoh: PDF Leads 3.658, Registration 869,
   FTD 88, Deposit Rp290 juta, ROAS 126%; dashboard menampilkan nilai demo lain.

Akibatnya, syarat "semua data dari dashboard, tanpa dummy" belum bisa dipenuhi dengan kondisi
sekarang. Yang kurang adalah **sumber data bulanan yang asli**, bukan templatenya.

## 2. Struktur dashboard

| Halaman (route) | Data | Penyimpanan |
|---|---|---|
| Overview `/overview` | Ringkasan KPI, donut, grafik social, inventory | konstanta |
| My Work `/my-work` | Tugas, review | konstanta + `jgf-review-decisions` |
| Marketing Performance | 14 KPI (Actual/Target), funnel, weekly pacing | konstanta + `marketing-kpi-values` |
| Social Media | Instagram, TikTok, YouTube (Audience, Impressions, Reach, Engagement, Post) | konstanta + `jgf-social-connections` |
| Team Scorecards | Orang, KPI, skor | `jgf-team-scorecards` |
| Content Calendar | Kartu konten (judul, platform, PIC, status, tanggal) | `jgf-content-calendar` |
| Projects | Proyek, checklist, evidence | `jgf-new-projects`, `jgf-project-progress` |
| Inventory | Merchandise, equipment, log | `jgf-inventory-*` |
| Promoter | Akun IG/TikTok, verifikasi, checklist post | `jgf-promotors` |
| AI Assistant, Agent Office, Integrations | Placeholder | tidak ada |

Teknologi: React 19, React Router (HashRouter), Tailwind v4, Chart.js. Tidak ada autentikasi,
tidak ada pustaka PDF.

## 3. Struktur PDF acuan

Format: sampul A4 potret, lalu spread dua halaman A4 (lanskap). Warna: merah tua (#8B1220-an),
hitam/abu gelap, putih. Judul serif tebal (Playfair-like), isi sans (Montserrat-like). Tiap bagian
punya pita nomor ("01 INTRODUCTION"), nomor halaman di sudut bawah.

| Hal. | Isi |
|---|---|
| 01 | Sampul: Marketing Department, 2026 JULY, Monthly Report, logo JAVA |
| 02–03 | Halaman judul (penyusun, jabatan), Table of Content |
| 04–05 | Executive Summary: 8 angka utama, narasi, grafik pencapaian KPI, tabel KPI/Target/Result/Status, Catatan Strategis |
| 06–07 | Update: Podcast Studio (Status, Insight, Next Action, 8 foto) |
| 08 | Social Media Overview: 4 angka + pembanding bulan lalu, donut engagement, Awareness Ads Report, profil tim |
| 09–15 | Satu halaman per platform: YouTube, TikTok Official, TikTok People, Instagram, Facebook, Threads, X (followers, views, jumlah post, Insights, Next Plan, screenshot) |
| 16–17 | Content Production & Publishing |
| 18–19 | Campaign Performance: spend, leads, registration, FTD, deposit, ROAS, funnel, Key Metrics (CPM, CPC, CTR, CPL, CPR, CPA, Rev/FTD), Channel Breakdown, Insights, Next Plan |
| 20–21 | Analyst Performance |
| 22–23 | Ads Video: status, kategorisasi 4 pilar, Content Highlights (6 foto) |
| 24–25 | Telesales Reward & Training, Social Media Promoter |
| 26–27 | Action Plan, Outro |

## 4. Pemetaan data: laporan ke dashboard

Status: **Ada** = tersedia dan bisa dipakai; **Demo** = ada tetapi nilainya buatan;
**Tidak ada** = belum ada di dashboard.

| Komponen laporan | Sumber di dashboard | Status |
|---|---|---|
| Total Leads, Registration, FTD | Marketing Performance (kartu KPI) | Demo; satu bulan acuan saja |
| Total Deposit, ROAS, CPL, CPR, CPA | Marketing Performance | Demo |
| Target tiap KPI | Marketing Performance (kolom Target) | Demo; sama untuk semua bulan |
| Perbandingan bulan lalu | faktor periode | Demo (hasil rumus, bukan riwayat) |
| CPM, CPC, CTR, Revenue per FTD | tidak ada | Tidak ada |
| Channel Breakdown (Meta, Google, Organic) | tidak ada | Tidak ada |
| Funnel Leads → Registration → FTD | Marketing Performance (funnel) | Demo |
| Impression, Engagement, Followers per platform | Social Media | Demo; hanya IG, TikTok, YouTube |
| TikTok People, Facebook, Threads, X | Social Media (Facebook dan X "not tracked") | Tidak ada |
| Awareness Ads Report (ad cost, new followers) | tidak ada | Tidak ada |
| Jumlah dan jenis konten | Content Calendar (kartu + status) | Ada, tetapi isinya contoh; tidak ada jenis konten (shorts/live/webinar) |
| Analyst Performance (signal, coaching, artikel, webinar) | Team Scorecards (KPI umum per orang) | Tidak ada metrik analis |
| Program Promoter | Promoter (akun, verifikasi, checklist post) | Ada (per browser) |
| Ads Video, Telesales Reward & Training, Podcast Studio | Projects (jika dicatat sebagai proyek) | Sebagian; tidak ada struktur khusus |
| Action Plan | tidak ada | Tidak ada |
| Nama dan jabatan penyusun, profil tim | `src/data/people.js` (nama + foto), profil di sidebar | Ada (foto 9 orang; jabatan tidak lengkap) |
| Foto kegiatan, thumbnail, screenshot akun, materi iklan | tidak ada | Tidak ada |
| Evidence proyek | Project Detail ("uploaded locally in this session") | Hilang saat halaman dimuat ulang |

## 5. Yang bisa dan tidak bisa dibuat sekarang

Bisa dibuat tanpa sumber data baru:
- Master template (semua jenis halaman PDF) sebagai komponen React yang dipakai ulang.
- Mesin perhitungan KPI (achievement, growth, conversion, ROAS, CPL, CPA) dengan penanganan nol/kosong.
- Generator narasi berbasis aturan, bisa diedit.
- Halaman Monthly Report Generator: pilih periode, pilih bagian, editor, preview, simpan konfigurasi.
- Ekspor PDF lewat cetak browser (`@page` A4, satu spread per lembar) tanpa pustaka tambahan.

Tidak bisa dipenuhi sampai ada sumber data asli:
- Angka aktual per bulan, perbandingan antarbulan yang benar.
- Foto/thumbnail/screenshot per periode.
- Platform dan metrik yang belum ada di dashboard (lihat tabel).

## 6. Keputusan yang dibutuhkan

Dari mana data bulanan yang asli akan masuk:

- **A. Form input bulanan di dashboard** (disarankan untuk mulai): satu halaman "Monthly Data" untuk
  mengisi angka, teks, dan mengunggah foto per bulan; disimpan di browser dan bisa diekspor/impor
  sebagai file JSON. Laporan membaca dari sini. Tanpa server, data hanya ada di perangkat yang
  mengisinya kecuali filenya dibagikan.
- **B. Google Sheets**: laporan membaca sheet yang dipublikasikan. Angka terpusat dan bisa diisi tim,
  tetapi sheet harus dibuat mengikuti struktur tertentu dan dibuka aksesnya; foto tetap butuh tempat
  simpan (mis. tautan Drive).
- **C. Backend sungguhan** (database + unggah berkas + login): paling lengkap, pekerjaan terbesar,
  dan butuh hosting di luar GitHub Pages.
