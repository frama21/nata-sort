# NATA — Product Knowledge

> Dokumen acuan tunggal tentang produk **NATA** (paket `nata-sort`): apa itu, untuk siapa, bagaimana cara kerjanya, apa yang sudah dan belum ada, serta bagaimana dibangun, diamankan, dan dijalankan.

|                    |                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Versi produk**   | 2.2.0 (rilis 2026-07-15) + perubahan _Unreleased_ (rename brand ke NATA)                                                         |
| **Snapshot kode**  | Branch `chore/app`, 2026-10-24                                                                                                   |
| **Sumber utama**   | Kode di `src/`, `server/`, `package.json`, `vite.config.ts`, `Dockerfile`, `docker-compose.yml`, `firebase.json`                 |
| **Sumber sekunder**| `README.md`, `CHANGELOG.md`, `docs/*.md` (berlabel v2.0.1, sebagian usang — lihat [Bagian 21](#21-ketidakkonsistenan-dokumen-vs-kode)) |
| **Pembaca**        | Tim produk, engineer baru, QA, support, dan stakeholder non-teknis                                                               |
| **Aturan konflik** | Bila dokumen lama dan kode berbeda, **kode yang benar**. Klaim yang hanya berasal dari docs lama ditandai _(per docs v2.0.1)_.   |

## Daftar Isi

1. [Ringkasan eksekutif](#1-ringkasan-eksekutif)
2. [Visi, misi, dan positioning](#2-visi-misi-dan-positioning)
3. [Problem statement dan gap pasar](#3-problem-statement-dan-gap-pasar)
4. [Target pengguna dan persona](#4-target-pengguna-dan-persona)
5. [Goals, non-goals, dan prinsip produk](#5-goals-non-goals-dan-prinsip-produk)
6. [Peta fitur](#6-peta-fitur)
7. [User flows](#7-user-flows)
8. [Keyboard dan interaksi](#8-keyboard-dan-interaksi)
9. [Format yang didukung](#9-format-yang-didukung)
10. [Aturan bisnis dan batas (constants)](#10-aturan-bisnis-dan-batas-constants)
11. [Arsitektur ringkas](#11-arsitektur-ringkas)
12. [Keamanan dan privasi](#12-keamanan-dan-privasi)
13. [Deployment dan operasi](#13-deployment-dan-operasi)
14. [Desain dan UX](#14-desain-dan-ux)
15. [Kualitas dan pengujian](#15-kualitas-dan-pengujian)
16. [Tech stack dan dependensi](#16-tech-stack-dan-dependensi)
17. [Metrik keberhasilan](#17-metrik-keberhasilan)
18. [Roadmap dan backlog](#18-roadmap-dan-backlog)
19. [Riwayat versi](#19-riwayat-versi)
20. [Risiko, keterbatasan, dan known issues](#20-risiko-keterbatasan-dan-known-issues)
21. [Ketidakkonsistenan dokumen vs kode](#21-ketidakkonsistenan-dokumen-vs-kode)
22. [FAQ dan pertanyaan terbuka](#22-faq-dan-pertanyaan-terbuka)
23. [Glosarium dan peta sumber](#23-glosarium-dan-peta-sumber)

---

## 1. Ringkasan eksekutif

**NATA** adalah aplikasi web untuk **menyortir foto dan video lokal dengan keyboard**, yang berjalan **100% di browser**. Pengguna membuka sebuah folder di komputernya, melihat file satu per satu berurutan menurut waktu pengambilan, lalu menekan tombol angka `1`–`9` untuk memasukkan file ke sub-folder tujuan. **Tidak ada satu byte pun yang diunggah.** Tidak ada akun, telemetri, atau backend untuk media pengguna.

| Atribut             | Nilai                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| Nama brand          | **NATA**                                                                                                      |
| Judul aplikasi/PWA  | "NATA — Sortir Foto & Video Lokal"                                                                            |
| Nama paket          | `nata-sort` (juga nama image/container Docker)                                                                |
| Nama folder/remote  | `nata-photo` (lokal) dan `frama21/photo-sorter` (URL GitHub yang masih dipakai di `security.txt`)             |
| Bahasa antarmuka    | **Hanya Bahasa Indonesia** (string inline; `lang="id"`). Tidak ada pengalih bahasa.                           |
| Bahasa kode/dokumen | Inggris (kode, komentar, README, CHANGELOG)                                                                   |
| Browser             | **Chromium saja**: Chrome, Edge, Opera (butuh File System Access API dan secure context)                      |
| Platform            | Web/PWA (dapat dipasang, bisa offline). Desktop target utama; mobile didukung bila browser punya API tersebut |
| Model data          | Satu file JSON `nata-sort-db.json` yang disimpan **di dalam folder yang dibuka**                              |
| Server              | Hanya menyajikan file statis (Express 5 + helmet). Tidak memproses media.                                     |

**Nilai inti dalam satu kalimat:** _sortir ribuan file secepat Anda bisa menekan tombol angka, tanpa menyerahkan foto ke layanan cloud._

**Hal yang membuat NATA berbeda:**

- Privasi absolut — tanpa upload, tanpa telemetri, CSP mengunci egress.
- Satu ketukan per file, otomatis maju ke file berikutnya.
- Urutan kronologis dari metadata (EXIF / mediainfo), bukan nama file.
- Preview RAW dari 12 vendor kamera langsung di browser (JPEG tertanam + fallback `libraw-wasm`).
- Aman untuk data: default Copy, tidak pernah menimpa file, undo, progres tersimpan otomatis.

---

## 2. Visi, misi, dan positioning

**Visi** _(PRD)_: Memberi siapa pun yang punya pustaka media lokal besar cara yang cepat, privat, dan menyenangkan untuk memilah ribuan file — secepat menekan tombol angka — tanpa menyerahkan foto ke layanan cloud.

**Enam pilar produk**

| #   | Pilar                         | Arti praktis                                                                          |
| --- | ----------------------------- | ------------------------------------------------------------------------------------- |
| 1   | Local-first dan privat        | File dibaca/ditulis langsung di disk pengguna lewat File System Access API            |
| 2   | Cepat dengan keyboard         | `1`–`9` memilah dan maju otomatis; navigasi `←` `→` `Space`; `U` ke file belum disortir |
| 3   | Fasih berbagai format         | Raster, SVG, ICO, RAW (12 vendor), dan video                                          |
| 4   | Tangguh dan dapat dipulihkan  | Undo, nama file anti-tabrakan, DB auto-save, reset aman bila DB rusak                 |
| 5   | Dapat dipasang dan offline    | PWA; WASM `libraw` ikut di-precache                                                   |
| 6   | Dikeraskan secara default     | CSP ketat, cross-origin isolation, container read-only, audit dependensi              |

**Positioning:** alat triase **ringan** antara _file manager_ OS (privat tapi lambat dan tanpa urutan kronologis/preview RAW) dan _DAM/katalog_ desktop (kuat tapi berat, berbayar, dan memaksa import). NATA bukan editor, bukan katalog, dan bukan layanan cloud.

---

## 3. Problem statement dan gap pasar

**Siapa yang punya masalah:** fotografer, videografer, kreator, dan orang tua dengan tumpukan hasil SD-card, folder "to-sort", dan impor dari ponsel.

**Mengapa solusi yang ada kurang:**

| Alternatif            | Kekurangan                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Layanan cloud         | Perlu upload (bandwidth, kuota), isu privasi dan residensi data                             |
| DAM/katalog desktop   | Lambat, berpendirian soal katalog/import, sering berbayar, berlebihan untuk tugas sederhana |
| File manager OS       | Privat, tetapi tanpa urutan kronologis, preview RAW/video lemah, tanpa pemilahan satu tombol, tanpa undo yang sesuai |

**Celah yang diisi NATA** — alat yang sekaligus: (1) bekerja pada file di tempat, (2) mengurutkan menurut waktu ambil sebenarnya, (3) mem-preview format terluas, (4) memilah dengan satu tombol + Copy/Cut + undo, (5) tanpa upload/akun/instalasi/konfigurasi, (6) berfungsi offline.

**Bila tidak diselesaikan:** pustaka tetap tak tersortir, pengguna membayar dan mempelajari software berat, atau mengorbankan privasi dengan mengunggah.

---

## 4. Target pengguna dan persona

| Persona                                    | Konteks                                                                                          | Bergantung pada                                                                 | Surface |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------- |
| **A — "Rara"**, fotografer/kreator         | Pernikahan/acara; ribuan CR3/ARW + klip; tidak boleh mengunggah materi klien                     | Preview RAW tajam, urutan kronologis, mode Cut, undo. Contoh folder `Keep`/`Reject`/`Client-A` di tombol 1–3 | Desktop |
| **B — "Deni"**, individu sadar privasi     | Dump foto keluarga/pribadi; menolak cloud                                                        | Desain tanpa egress, mode Copy, PWA dengan jaringan dimatikan                   | Desktop |
| **C — "Mira"**, offline/konektivitas rendah| Sering bepergian; menyortir di laptop saat waktu luang                                           | Precache PWA (termasuk WASM RAW)                                                | Desktop |
| **D — "Anton"**, penyortir kasual di ponsel| Memilah screenshot dan klip di browser Chromium mobile                                           | Bar aksi bawah dengan satu tombol berwarna per folder, geser untuk navigasi     | Mobile  |

> Mobile bergantung pada ketersediaan File System Access API di browser mobile. Desktop adalah target utama.

---

## 5. Goals, non-goals, dan prinsip produk

### 5.1 Goals

| ID  | Goal                                                                                         |
| --- | -------------------------------------------------------------------------------------------- |
| G1  | Privasi absolut                                                                              |
| G2  | Triase cepat dengan keyboard                                                                 |
| G3  | Cakupan format luas (raster, SVG, RAW, video)                                                |
| G4  | Dapat dibalik dan aman untuk data (tak menimpa diam-diam, selalu bisa undo, state dipulihkan)|
| G5  | Tangguh (decoder macet, state rusak, format tak didukung)                                    |
| G6  | Akses tanpa gesekan (tanpa instalasi/akun/konfigurasi; PWA; offline)                         |
| G7  | Aman secara default                                                                          |

### 5.2 Non-goals

| ID  | Bukan tujuan                                                                  |
| --- | ----------------------------------------------------------------------------- |
| N1  | Sinkronisasi cloud, akun, atau berbagi                                        |
| N2  | Editing atau "develop" RAW                                                    |
| N3  | Indeks rekursif — hanya level atas folder yang dibuka                         |
| N4  | DAM penuh (rating, tag, katalog, pencarian)                                   |
| N5  | Paritas Firefox/Safari (API hanya ada di Chromium)                            |
| N6  | Pemrosesan media di sisi server                                               |
| N7  | Kolaborasi multi-pengguna                                                     |
| —   | Rename/rotate/crop/transcode; menghapus file sumber selain separuh "pindah" dari Cut atau penghapusan folder tujuan oleh pengguna; multi-folder/multi-tab; jaminan semua codec video; undo lintas reload; menjadi file manager umum |

### 5.3 Sepuluh prinsip produk _(docs/PRINCIPLES.md)_

1. Privasi dan local-first
2. Zero-trust terhadap semua input
3. Aman secara default
4. Keselamatan data
5. Resilien dan degradasi anggun: gagal kecil, tidak pernah gagal diam-diam, tidak pernah gagal total
6. Performa dan responsif
7. Aksesibilitas dan inklusivitas, UI berbahasa Indonesia
8. Sederhana dan permukaan serangan kecil
9. Deployment reprodusibel dan dikeraskan
10. Maintainability dan konvensi

**Urutan prioritas keputusan (yang lebih atas menang):** Privasi → Keselamatan data → Keamanan/zero-trust → Resiliensi → Kesederhanaan → Performa, aksesibilitas, DX.

**Uji untuk setiap usulan:** _Apakah ini menjaga byte tetap di perangkat, menjaga file pengguna aman, menjaga default tetap aman, dan membatasi dampak kegagalan pada satu file?_

**Enam prinsip kode (kriteria review):** Clean Code, YAGNI, DRY, KISS, Semantic (HTML/penamaan), A11y.

### 5.4 Aturan proyek yang berlaku saat berkontribusi

- Tidak ada upload, telemetri, atau egress jaringan baru; jangan melemahkan CSP atau menambah `connect-src` untuk konten pengguna.
- Jangan menimpa file pengguna (pakai `getUniqueFileName`); default Copy; aksi destruktif harus bisa di-undo.
- Penulisan DB hanya lewat service project-db (`enqueue`/`writeChain`); DB dan log operasi tidak boleh memuat handle atau objek `File`.
- Input dianggap bermusuhan: validasi dan batasi file, field DB, nama folder. Tanpa `dangerouslySetInnerHTML` untuk data tak tepercaya; SVG hanya via `<img>`.
- Layout FSD satu arah: `app → pages/features → shared`; impor lewat `index.ts` tiap slice.
- Format baru hanya ditambahkan di `src/features/media/config/file-formats.ts`.
- Cabut blob URL, hentikan worker WASM; async yang tampil ke pengguna dibungkus try/catch/finally dan menampilkan toast.
- Dependensi produksi seminimal mungkin; `pnpm audit` harus bersih.
- Jangan ubah tanpa alasan kuat: CSP/header di `server/index.js` dan `firebase.json`, patch worker libraw dan timeout 20 detik, versi skema DB `"2.0"`.

---

## 6. Peta fitur

### 6.1 Ringkasan status

| #   | Fitur                                              | Status       | Catatan                                                              |
| --- | -------------------------------------------------- | ------------ | -------------------------------------------------------------------- |
| F1  | Buka folder lokal & scan level atas                | Shipped      | Tidak rekursif                                                       |
| F2  | Urutan kronologis                                  | Shipped      | EXIF/mediainfo → fallback `lastModified`                             |
| F3  | Preview raster, SVG, ICO                           | Shipped      | Via `<img>` blob URL                                                 |
| F4  | Preview RAW                                        | Shipped      | JPEG tertanam, fallback `libraw-wasm`                                |
| F5  | Preview video                                      | Shipped      | Pemutar native; tergantung codec browser                             |
| F6  | HEIC/HEIF                                          | Partial      | Bisa disortir, **tidak bisa di-preview**                             |
| F7  | Panel metadata                                     | Shipped      | Foto dan video; lazy dan ter-cache                                   |
| F8  | Sortir `1`–`9` + auto-advance                      | Shipped      |                                                                      |
| F9  | Mode Copy / Cut                                    | Shipped      | Default Copy                                                         |
| F10 | Nama file anti-tabrakan                            | Shipped      | `_1`, `_2`, …                                                        |
| F11 | Undo (maks 20)                                     | Shipped      | Hanya sesi berjalan                                                  |
| F12 | Lompat ke belum disortir (`U`)                     | Shipped      | Dengan wraparound dan state "semua tersortir"                        |
| F13 | Kelola folder tujuan + validasi nama               | Shipped      | Hapus folder tanpa konfirmasi (lihat [Bagian 20](#20-risiko-keterbatasan-dan-known-issues)) |
| F14 | Multi-select dan batch sort                        | Shipped      | 1 batch = 1 entri undo                                               |
| F15 | Filmstrip dan grid (lazy, infinite scroll)         | Shipped      | v2.1.0 / v2.2.0                                                      |
| F16 | Zoom, pan, loupe                                   | Shipped      | Loupe hanya desktop                                                  |
| F17 | Log operasi dan statistik                          | Shipped      | Tampil 3 terakhir; simpan 50                                         |
| F18 | Persistensi DB dan resume                          | Shipped      | `nata-sort-db.json`                                                  |
| F19 | PWA / offline                                      | Shipped      | App shell + WASM di-precache                                         |
| F20 | Tema terang/gelap                                  | Shipped      | Toggle 2 arah (lihat 6.14)                                           |
| F21 | Halaman Bantuan (`/help`)                          | Shipped      | 5 kartu statis                                                       |
| F22 | Dialog pintasan keyboard (`?`)                     | Shipped      |                                                                      |
| F23 | Mobile (bar aksi bawah, swipe, pinch)              | Shipped      |                                                                      |
| F24 | Redo                                               | **Not built**| Backlog (FR-C1)                                                      |
| F25 | Rename / template nama                             | **Not built**| Nama asli dipertahankan                                              |
| F26 | Scan rekursif                                      | **Not built**| Non-goal N3 / Could                                                  |
| F27 | Ekspor laporan sortir                              | **Not built**| Backlog (FR-C7)                                                      |
| F28 | Pengalih bahasa EN/ID                              | **Not built**| UI hanya Indonesia                                                   |
| F29 | Pintasan untuk folder ke-10 dan seterusnya         | **Not built**| Hanya 9 folder pertama berpintasan                                   |

### 6.2 Buka folder dan scan (F1)

- Satu tombol **"Pilih Folder Foto"** memanggil `window.showDirectoryPicker()`.
- Scan memakai `dirHandle.values()`, **hanya level atas**. Yang masuk daftar: entri bertipe file dengan ekstensi terdaftar. Sub-folder dan file DB dilewati.
- Folder kosong atau tanpa file didukung tetap pada state kosong.
- Browser tanpa API: toast "Browser tidak mendukung File System Access API" dan pesan untuk memakai Chrome/Edge/Opera terbaru.
- Membatalkan picker (`AbortError`) tidak dianggap error; kembali diam ke state awal.
- Membuka folder baru: blob URL dicabut; antrean RAW, set gagal-decode, antrean metadata, tumpukan undo, seleksi, error, dan operasi direset.
- **Penjaga keluar halaman:** bila ada foto termuat dan pengguna berpindah rute, `window.confirm` memberi tahu bahwa folder akan ditutup (progres sudah tersimpan). Handle folder hanya ada di memori.
- Tidak ada batas ukuran file atau jumlah item saat scan. Grid dipaginasi hanya demi performa.

### 6.3 Urutan kronologis (F2)

- Terlama lebih dulu. Prioritas kunci urut:
  - **Gambar:** EXIF `DateTimeOriginal` → `DateTimeDigitized` → `DateTime`.
  - **Video:** tanggal QuickTime / mediainfo (Encoded → Recorded → Tagged → File_Modified).
  - **Lainnya / gagal:** `File.lastModified`.
- Seri sama diurut `name.localeCompare`.
- Tanggal diekstrak oleh **8 worker** paralel, hanya untuk file yang belum punya cache metadata; membuka ulang folder yang sudah ter-cache nyaris instan. Progres toast: "Membaca tanggal foto n/total…" (diperbarui tiap 8 file).
- Format tanggal yang diterima: `"2023:01:02 13:04:05"`, ISO 8601 dengan `T`, `"2023-01-02 13:04:05"`, dan `"UTC 2023-01-02 13:04:05"` (mediainfo). String tak terurai → `null` → pakai `lastModified`.

### 6.4 Preview (F3–F6)

| Jenis             | Perilaku                                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raster/SVG/ICO    | `<img>` dari blob URL. Gagal decode → blob URL dibuat ulang dan dicoba hingga 2 kali, lalu spinner disembunyikan. SVG **hanya** lewat `<img>` sehingga skrip tak jalan. |
| Video             | `<video controls>` native dari blob URL. Tanpa transcode; AVI/WMV/MKV/FLV bergantung codec OS. Tanpa zoom/loupe.                                             |
| HEIC/HEIF         | Tidak ada preview. Tampil ikon dan label format ("Preview tidak tersedia"); tetap bisa disortir.                                                           |
| RAW               | Didekode **hanya untuk foto RAW saat ini**, sesuai permintaan, satu per file. Status: "Mendecode RAW…" / "Ini mungkin memerlukan waktu beberapa detik".      |

**Pipeline RAW** (`raw-decoder.service.ts`):

1. Pindai byte file untuk penanda JPEG `FF D8 FF` (SOI). Tiap kandidat membentang dari SOI ke SOI berikutnya (atau EOF), maks 40 MB.
2. Validasi hingga 6 kandidat terbesar dengan `createImageBitmap`; pilih yang **terlebar**; encode ulang ke JPEG dengan sisi terpanjang ≤ 2048 px (kualitas 0,9).
3. Bila lebar ≥ 800 px ("tajam") → pakai.
4. Bila tidak, dan file ≤ 80 MB → dekode `libraw-wasm`: thumbnail tertanam dulu, lalu dekode sensor setengah ukuran (`halfSize`, AHD `userQual: 3`, sRGB, 8-bit, white balance kamera), dijaga **timeout 20 detik**.
5. Hasil serba putih (≥ 95% sampel byte = 255) dianggap gagal.
6. Pilihan terakhir: preview tertanam kecil, atau `null` ("Preview tidak tersedia").
7. Worker di-`terminate()` setelah setiap dekode. Worker libraw ditambal (`patchLibRawWorker`) karena bug hulu yang membuat promise menggantung saat error.
8. Dekode gagal dicatat dalam set gagal dan **tidak diulang** selama folder terbuka.
9. Thumbnail filmstrip/grid untuk semua RAW didekode di latar belakang dengan **3 worker**, hanya jalur JPEG tertanam, 512 px, masing-masing sekali coba.

### 6.5 Panel metadata (F7)

- **Foto** ("Informasi Foto"): kamera (make/model), lensa, ISO, shutter, aperture, focal length, tanggal, ukuran file, dimensi, megapiksel (1 desimal).
- **Video** ("Informasi Video"): durasi, fps, codec video dan audio, bitrate, dimensi, ukuran, tanggal.
- Nilai kosong ditampilkan `-`. Tanggal diformat dengan locale `id-ID`.
- Ekstraksi **malas**: hanya foto saat ini serta tetangga ±1; hanya 2 MB pertama untuk gambar (`MAX_HEADER_BYTES`); ter-cache di memori dan DB (debounce 1,5 detik, di-flush saat unmount).
- Ekstraksi gagal → objek default (ukuran file saja) + `console.warn`.
- **Keterbatasan diketahui:** `MediaInfoModule.wasm` tidak ikut dibuild, sehingga metadata video turun ke nilai default (tanpa crash).

### 6.6 Sortir 1–9 (F8)

- Pemicu: tombol angka, tombol folder di sidebar (`FolderManager`), atau tombol berwarna di bar aksi mobile.
- Sukses → catat `fileName → folderId`, tambah `SortOperation` sukses, dorong entri undo, **maju satu foto** (dijepit di indeks terakhir), simpan ke DB.
- Gagal → tercatat sebagai operasi `success:false`, error ditampilkan, **tidak maju**. Folder tujuan tak ditemukan: "Folder target tidak ditemukan".
- Menyortir ulang foto yang sudah tersortir ke folder lain **diizinkan**: pemetaan ditimpa, salinan lama di folder sebelumnya **tidak** dihapus.
- Maju tidak melewati foto yang sudah tersortir; gunakan `U` untuk itu.

### 6.7 Mode Copy dan Cut (F9)

| Mode               | Perilaku                                                                                         | Undo                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **Copy (default)** | File asli tetap di folder akar; salinan ditulis ke folder tujuan dengan `createWritable`         | Menghapus salinan berdasarkan `createdName`           |
| **Cut (opsional)** | Memakai `handle.move()` native bila ada, jika tidak salin lalu hapus asal                        | Memindahkan file kembali ke akar dengan nama aslinya  |

Mode disimpan di DB dan dipilih lewat tab di `FolderManager`.

### 6.8 Nama file anti-tabrakan (F10)

`getUniqueFileName` menambah akhiran sebelum ekstensi: `foto.jpg → foto_1.jpg → foto_2.jpg`. File tanpa ekstensi: `README → README_1`. Nama yang benar-benar ditulis disimpan sebagai `createdName` agar undo tepat sasaran. **Tidak ada file yang pernah ditimpa.**

### 6.9 Undo (F11) dan lompat ke belum disortir (F12)

- Tumpukan undo: maks **20** entri, di memori saja, dibersihkan saat folder dimuat ulang. **Satu batch = satu entri.** Tidak ada redo.
- Pemicu: `Ctrl/Cmd+Z` atau tombol Undo (nonaktif bila tumpukan kosong). Setelah undo, indeks kembali ke `anchorIndex` entri.
- Bila folder tujuan sudah hilang: "Tidak bisa undo: folder target tidak ditemukan". Menghapus sebuah folder juga membuang entri undo miliknya.
- Setelah reload, sortir yang dipulihkan dari DB **tidak bisa di-undo**.
- `U` / tombol "Belum disortir" maju ke foto belum tersortir berikutnya (melingkar). Jika semua tersortir: alert hijau "Semua N foto sudah disortir 🎉".

### 6.10 Kelola folder tujuan (F13)

- Folder tujuan adalah **sub-folder nyata** yang dibuat di folder akar (`getDirectoryHandle(name, {create:true})`).
- Nama kosong → "Folder N". Duplikat ditolak tanpa membedakan huruf besar/kecil.
- **Validasi nama** (`folder-name.utils.ts`) menolak: kosong setelah trim; > 200 karakter; `.` atau `..`; karakter `\ / : * ? " < > |`; karakter kontrol U+0000–U+001F; berakhir titik atau spasi; nama perangkat Windows `CON`, `PRN`, `AUX`, `NUL`, `COM1–9`, `LPT1–9` (dengan atau tanpa ekstensi). Spasi dan tanda hubung boleh.
- Pintasan `1`–`9` diberikan ke 9 folder pertama; folder ke-10 dan seterusnya tanpa pintasan (klik saja). Nomor pintasan **tidak diatur ulang** setelah penghapusan.
- 9 warna siklus: red, blue, green, yellow, purple, pink, indigo, orange, teal (kelas `bg-*-500`, teks putih).
- **Menghapus folder** menjalankan `removeEntry(name, {recursive:true})`: folder **beserta seluruh isinya** terhapus dari disk, **tanpa dialog konfirmasi**. Pemetaan dan entri undo folder itu ikut dibuang.
- Saat resume, folder yang tercatat tapi hilang di disk dilewati dengan toast "Folder X tidak ditemukan, dilewati", dan pemetaannya dibuang.

### 6.11 Multi-select dan batch sort (F14)

- Cara memilih: kotak centang di thumbnail; **Shift+klik** (rentang — jika item yang diklik sudah terpilih, seluruh rentang dibatalkan); tombol "Pilih belum disortir"; `Ctrl/Cmd+A` (grid); `Esc` membersihkan (grid).
- Saat ada seleksi, tombol angka atau tombol folder menyortir **seluruh seleksi** (tanpa maju), lalu seleksi dibersihkan. Kegagalan per file tercatat sebagai operasi gagal; ringkasan "N file diproses, M gagal".
- `BatchActionBar` tetap di bawah layar berisi tombol folder berwarna dan tombol X.

### 6.12 Filmstrip dan grid (F15)

- **Single view:** `ContentViewer` + `Filmstrip` (ScrollArea horizontal, otomatis memusatkan foto saat ini).
- **Grid:** `PAGE_SIZE = 60`, ditambah via IntersectionObserver (`rootMargin` 300 px). Kolom: 3 (default), 4 (sm), 5 (md), 6 (lg), 8 (xl). Tinggi tetap 72 dvh. Klik thumbnail membuka single view.
- Thumbnail: lencana warna folder bila tersortir, ring biru bila terpilih, ring primer bila saat ini; placeholder ikon + label format untuk video / non-previewable.

### 6.13 Zoom, pan, loupe (F16)

| Aspek       | Nilai                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Skala       | 1× – 5× (`MIN_SCALE`/`MAX_SCALE`)                                                              |
| Roda mouse  | Zoom (`scale -= deltaY * 0.0015 * scale`)                                                      |
| Dobel klik/tap | Toggle 1× ↔ 2×                                                                              |
| Drag        | Pan, hanya saat sedang zoom                                                                    |
| Pinch       | Zoom di layar sentuh                                                                           |
| Swipe 1 jari| Navigasi, hanya saat tidak zoom, ambang 50 px                                                  |
| Tombol      | +/− (langkah 0,5) dan reset di pojok kanan bawah                                               |
| Loupe       | Lingkaran 176 px, 2,5×, mengikuti kursor, **desktop saja** (`md:block`), hilang saat zoom transform |

### 6.14 Log operasi, statistik, tema, bantuan, PWA

- **Log operasi:** UI menampilkan 3 operasi terakhir (hijau sukses / merah gagal); DB menyimpan hingga 50 (ring buffer). Tiap catatan: `photoName, folderId, folderName, mode, success, error?, timestamp`. Kartu disembunyikan bila kosong.
- **Statistik:** total, tersortir, belum, operasi sukses/gagal. `ProgressBar` menampilkan "Foto n/total".
- **Tema:** `dark | light | system`, **default dark**; disimpan di `localStorage["nata-sort-theme"]`; kelas `light`/`dark` pada `<html>`. `ThemeToggle` hanya membalik terang/gelap sehingga "system" tak bisa dipilih lagi dari UI setelah toggle; `system` dibaca sekali dan tidak mengikuti perubahan OS secara langsung.
- **Halaman Bantuan (`/help`):** 5 kartu: Privasi, Persyaratan browser, Penyimpanan progres, Keamanan file, Pintasan keyboard.
- **Dialog pintasan:** tombol `?` di toolbar membuka `ShortcutsDialog` (daftar hard-coded; tidak memuat `Esc`).
- **PWA:** `autoUpdate`; manifest standalone, tema `#0a0f1a`, ikon 192/512; Workbox precache `js, css, html, wasm, svg, png, ico, woff2` dengan batas 4 MB per file (agar WASM libraw ≈ 1,3 MB masuk); `navigateFallback: /index.html`; service worker didaftarkan manual di `main.tsx` (tanpa skrip inline, menjaga CSP). PWA nonaktif saat dev.
- **Mobile:** `MobileActionBar` (di bawah `md`, hanya single view tanpa seleksi) berisi prev/next dan tombol per folder.

### 6.15 Persistensi dan resume (F18)

- File `nata-sort-db.json` di dalam folder yang dibuka, JSON ber-indentasi 2 spasi, `version: "2.0"`.
- **Tidak ada timer autosave**: setiap mutasi langsung ditulis. Metadata di-debounce 1,5 detik.
- Saat dibuka: folder, pemetaan, mode, `currentIndex` (dijepit), dan log operasi dipulihkan.
- Hapus file DB = proyek direset.
- Skema selengkapnya di [Bagian 11.5](#115-skema-database-nata-sort-dbjson).

---

## 7. User flows

### 7.1 Alur utama

1. Buka aplikasi di browser Chromium → klik **"Pilih Folder Foto"**.
2. Beri izin lewat picker OS.
3. Aplikasi memindai file level atas, memuat atau membuat DB, mengekstrak tanggal (progres tampil), lalu mengurutkan kronologis.
4. Pengguna membuat folder tujuan (otomatis mendapat pintasan dan warna).
5. Pengguna melihat foto dan metadatanya, lalu menekan `1`–`9`.
6. Copy menduplikasi, Cut memindahkan; aplikasi maju otomatis dan menyimpan.
7. `U` melompat ke file belum disortir; bila semua selesai muncul state "Semua N foto sudah disortir 🎉".
8. `Ctrl/Cmd+Z` membalik sortir terakhir kapan pun.

### 7.2 Alur batch

Grid → centang / Shift+klik / "Pilih belum disortir" / `Ctrl+A` → tekan angka atau klik tombol folder di bar bawah → seluruh seleksi disortir sebagai **satu** langkah undo → seleksi dibersihkan.

### 7.3 Edge flows

| Situasi                                  | Perilaku                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Picker dibatalkan                        | Kembali diam ke state kosong                                                                     |
| Browser tak didukung                     | Toast + pesan untuk memakai Chrome/Edge/Opera                                                    |
| DB tidak ada                             | Dibuat baru tanpa peringatan                                                                     |
| DB korup / bentuk salah / versi beda     | Toast ("Database rusak, dibuat ulang" / "Format database tidak valid, dibuat ulang" / "Database versi X tidak kompatibel, dibuat ulang"), DB baru menggantikan file lama **tanpa backup** |
| Folder tercatat hilang                   | Dilewati dengan toast; pemetaannya dibuang                                                       |
| Decode RAW gagal                         | Dicatat, tidak diulang; tampil "Preview tidak tersedia"                                          |
| Sortir gagal                             | Operasi gagal tercatat, error tampil, tidak maju                                                 |
| Sortir ulang foto tersortir              | Pemetaan ditimpa; salinan lama tetap di disk                                                     |
| Pindah rute saat ada foto                | `confirm` penjaga keluar halaman                                                                 |
| Chunk halaman gagal dimuat               | Dilempar ke `RouteErrorBoundary` ("Halaman ini mengalami kesalahan")                             |
| Error render fatal                       | `GlobalErrorBoundary` ("Terjadi kesalahan", "Coba lagi", "Muat ulang")                           |
| Tulis DB gagal                           | Toast "Gagal menyimpan data" / "Gagal update folder" / "Gagal update mode" (tulis metadata gagal diam-diam) |

---

## 8. Keyboard dan interaksi

### 8.1 Tabel pintasan

| Tombol                  | Aksi                                         | Cakupan                              |
| ----------------------- | -------------------------------------------- | ------------------------------------ |
| `1`–`9`                 | Sortir ke folder dengan pintasan itu (seluruh seleksi bila ada) | **Single view saja**    |
| `→`                     | Foto berikutnya                              | Single view                          |
| `←`                     | Foto sebelumnya                              | Single view                          |
| `Space`                 | Foto berikutnya (`preventDefault`)           | Single view                          |
| `U` / `u`               | Lompat ke belum disortir berikutnya          | Single view                          |
| `Ctrl/Cmd+Z`            | Undo                                         | Single view                          |
| `Ctrl/Cmd+A`            | Pilih / batal pilih semua                    | **Grid saja**                        |
| `Esc`                   | Bersihkan seleksi                            | **Grid saja**                        |
| `Shift+klik`            | Pilih rentang (toggle)                       | Thumbnail, single dan grid           |
| `Enter`                 | Tambah folder                                | Di dalam input nama folder           |
| Roda mouse / dobel klik | Zoom                                         | Area gambar                          |
| Geser ≥ 50 px           | Navigasi                                     | Layar sentuh, tidak saat zoom        |
| Pinch / drag / dobel tap| Zoom / pan / toggle 2×                       | Layar sentuh                         |
| Tombol `?`              | Buka dialog pintasan                         | Toolbar                              |

### 8.2 Kapan pintasan diabaikan

- Fokus berada di `<input>`, `<textarea>`, atau `contenteditable`.
- Ada `dialog[open]`.
- `e.defaultPrevented` sudah true.
- `Ctrl`, `Meta`, atau `Alt` ditekan (kecuali `Z` dan `A` sesuai tabel).

> **Catatan penting:** pintasan sortir/navigasi didaftarkan oleh `ContentViewer`, sehingga **tidak aktif di grid view**. Di grid hanya `Ctrl/Cmd+A` dan `Esc` yang bekerja.

---

## 9. Format yang didukung

Pencocokan berdasarkan ekstensi terakhir, tidak peka huruf besar/kecil. Hanya ekstensi terdaftar yang dipindai. Format baru **hanya** ditambah di `src/features/media/config/file-formats.ts`.

| Kategori          | Ekstensi                                                                                      | Preview                              |
| ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| JPEG              | `.jpg .jpeg .jpe`                                                                             | Ya                                   |
| PNG / GIF / WebP / AVIF | `.png` `.gif` `.webp` `.avif`                                                           | Ya (GIF beranimasi diputar)          |
| BMP / TIFF        | `.bmp .dib` / `.tiff .tif`                                                                    | Ya                                   |
| Vektor / ikon     | `.svg` `.ico`                                                                                 | Ya (SVG via `<img>` blob)            |
| HEIC / HEIF       | `.heic .heif`                                                                                 | **Tidak** (bisa disortir)            |
| RAW Canon         | `.cr2 .cr3 .crw`                                                                              | Dekoder RAW                          |
| RAW Nikon         | `.nef .nrw`                                                                                   | Dekoder RAW                          |
| RAW Sony          | `.arw .srf .sr2`                                                                              | Dekoder RAW                          |
| RAW Fuji          | `.raf`                                                                                        | Dekoder RAW                          |
| RAW Panasonic     | `.rw2 .raw`                                                                                   | Dekoder RAW                          |
| RAW Olympus       | `.orf`                                                                                        | Dekoder RAW                          |
| RAW Pentax        | `.pef .ptx`                                                                                   | Dekoder RAW                          |
| RAW Leica / DNG   | `.dng .rwl`                                                                                   | Dekoder RAW                          |
| RAW Hasselblad    | `.3fr`                                                                                        | Dekoder RAW                          |
| RAW Sigma         | `.x3f`                                                                                        | Dekoder RAW                          |
| Video             | `.mp4 .m4v .webm .ogv .mov .qt .avi .wmv .mkv .flv .mpeg .mpg .mpe .ts .3gp .3g2`             | Ya, **bila browser bisa memutar codec-nya** |

Catatan:

- `.ts` diperlakukan sebagai MPEG Transport Stream (video), sehingga file TypeScript di sebuah folder akan ikut terdeteksi.
- Fungsi bernama `isSupportedImage` juga meloloskan video.
- Kategori internal: `standard | raw | vector | video | other`.

---

## 10. Aturan bisnis dan batas (constants)

| Konstanta                           | Nilai           | Arti                                                | Lokasi                                              |
| ----------------------------------- | --------------- | --------------------------------------------------- | --------------------------------------------------- |
| `MAX_UNDO`                          | 20              | Kedalaman undo                                      | `sorter/hooks/useFileSystem.ts`                     |
| `MAX_OPERATIONS`                    | 50              | Log operasi tersimpan                               | `sorter/services/project-db.service.ts`             |
| Operasi tampil di UI                | 3               | Kartu log                                           | `OperationLog.tsx`                                  |
| `MAX_SORTED_ENTRIES`                | 100.000         | Batas pemetaan saat load                            | `project-db.service.ts`                             |
| `MAX_METADATA_ENTRIES`              | 100.000         | Batas cache metadata saat load                      | `project-db.service.ts`                             |
| `MAX_FOLDERS`                       | 1.000           | Batas folder di DB                                  | `project-db.service.ts`                             |
| `DB_VERSION`                        | `"2.0"`         | Versi skema (beda versi = reset)                    | `project-db.service.ts`                             |
| Panjang nama folder                 | 200             | Karakter                                            | `sorter/utils/folder-name.utils.ts`                 |
| Folder berpintasan / warna          | 9 / 9           |                                                     | `useFileSystem.ts`                                  |
| Worker ekstraksi tanggal            | 8               | Paralel saat scan                                   | `useFileSystem.ts`                                  |
| Worker thumbnail RAW                | 3               | Latar belakang                                      | `useFileSystem.ts`                                  |
| Debounce persist metadata           | 1.500 ms        |                                                     | `useFileSystem.ts`                                  |
| `MAX_HEADER_BYTES`                  | 2 MB            | Bagian awal gambar yang dibaca EXIF                 | `media/services/metadata.service.ts`                |
| `MAX_FULL_DECODE_BYTES`             | 80 MB           | Batas dekode penuh libraw                           | `media/services/raw-decoder.service.ts`             |
| `MAX_CANDIDATE_BYTES`               | 40 MB           | Per kandidat JPEG tertanam                          | `raw-decoder.service.ts`                            |
| Kandidat JPEG divalidasi            | 6               |                                                     | `raw-decoder.service.ts`                            |
| `SHARP_PREVIEW_MIN_WIDTH`           | 800 px          | Ambang "tajam"                                      | `raw-decoder.service.ts`                            |
| `MAX_PREVIEW_DIM`                   | 2048 px         | Sisi terpanjang preview ter-cache                   | `raw-decoder.service.ts`                            |
| `RAW_THUMB_DIM`                     | 512 px          | Thumbnail filmstrip/grid                            | `raw-decoder.service.ts`                            |
| `LIBRAW_TIMEOUT_MS`                 | 20.000 ms       | Per langkah libraw                                  | `raw-decoder.service.ts`                            |
| Retry decode gambar                 | 2               |                                                     | `ContentViewer.tsx`                                 |
| `PAGE_SIZE` grid                    | 60              |                                                     | `GridView.tsx`                                      |
| `LOUPE_SIZE` / `LOUPE_ZOOM`         | 176 px / 2,5×   |                                                     | `ContentViewer.tsx`                                 |
| `MIN_SCALE` / `MAX_SCALE`           | 1 / 5           |                                                     | `sorter/hooks/useZoomPan.ts`                        |
| `SWIPE_THRESHOLD`                   | 50 px           |                                                     | `useZoomPan.ts`                                     |
| Toast tersimpan / kedaluwarsa       | 3 / 3 detik     | Sukses dan error; loading menetap                   | `shared/stores/status.store.ts`                     |
| Batas file precache PWA             | 4 MB            |                                                     | `vite.config.ts`                                    |
| Port server / healthcheck           | 8080 / `/healthz`|                                                    | `server/index.js`, `Dockerfile`                     |

---

## 11. Arsitektur ringkas

### 11.1 Layout kode (Feature-Sliced, satu arah)

```
src/
  app/        composition root: App.tsx, main.tsx, config/app.config.ts, errors/GlobalErrorBoundary,
              layouts/{MainLayout,Navbar,ThemeToggle}, providers/{AppProviders,ThemeProvider},
              routes/{routes.tsx,feature-routes.ts,route-discovery.ts,route-fallbacks.tsx}, styles/globals.css
  features/
    sorter/   rute "/"      (nav "Sortir", order 0)  — controller, service DB, util file, 12 komponen UI
    media/    tanpa UI/rute — registry format, metadata, dekoder RAW; API publik di index.ts
    help/     rute "/help"  (judul "Bantuan", order 10)
  shared/     components/ui (primitif in-house), components/feedback/StatusIndicator,
              lib/utils.ts (cn), stores/status.store.ts, types/route.types.ts
  test/       setup.ts, global-mocks (mock File System Access)
  types/      vite-env.d.ts
```

**Aturan impor** (ditegakkan oleh ESLint `no-restricted-imports` dan `scripts/check-architecture.mjs`): `shared` tidak boleh mengimpor `features`/`app`; fitur tidak boleh mengimpor `app`; lintas fitur harus lewat `@/features/<nama>` (`index.ts`); siklus impor dilaporkan. Blok ESLint dibangkitkan dari isi `src/features/*`, jadi menambah fitur tak perlu mengubah konfigurasi.

**Route discovery:** `import.meta.glob("/src/features/*/routes.ts", {eager:true})` → `collectFeatureRoutes`. Tiap rute `{path, lazy, title?, nav?{label,order}}`; rute tak valid/duplikat dicatat `[routes]` lalu dilewati; halaman dimuat malas. Menghapus folder fitur menghapus rutenya. Navbar menampilkan tautan hanya bila rute bernavigasi > 1.

### 11.2 State

| Rumah state                    | Isi                                                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Hook `useFileSystem` (±960 baris) | `photos`, `currentIndex`, `folders`, `sortedPhotos`, `moveMode`, `operations`, `undoStack`, `rawPreviewUrls`, `metadataByKey`, status loading/error; ref untuk handle folder dan antrean. **Handle tak pernah masuk state ter-persist.** |
| Zustand `status.store`         | Toast navbar: `{id, type idle/loading/success/error, message, icon db/folder/file/save}`; maks 3                 |
| `ThemeProvider` + localStorage | Tema                                                                                                             |
| `nata-sort-db.json`            | State durable per folder                                                                                         |

### 11.3 Alur data

```
showDirectoryPicker
   └─ revoke URL lama, reset antrean/undo
   └─ initProjectDatabase  ──► baca/validasi/sanitize nata-sort-db.json (atau buat baru)
   └─ scan level atas ─► filter ekstensi terdaftar ─► blob URL (bila previewable)
   └─ ekstrak tanggal (8 worker, hanya yang belum ter-cache) ─► urut kronologis
   └─ pulihkan folder (by name), mode, index, operasi
        │
        ▼
 Tampilkan foto saat ini ─► metadata malas (±1) ─► [RAW? dekode sesuai kebutuhan]
        │
 Tekan 1–9 ─► getUniqueFileName ─► Copy: tulis salinan │ Cut: handle.move() / salin+hapus
        │          └─► catat SortOperation, dorong undo, maju, enqueue tulis DB
        ▼
 Ctrl/Cmd+Z ─► Copy: hapus createdName │ Cut: pindah balik ke akar ─► kembalikan index
```

### 11.4 Layanan dan utilitas utama

| Modul                                         | Peran                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `sorter/services/project-db.service.ts`       | Baca/sanitize/tulis DB; antrean penulis tunggal; semua mutasi lewat `mutateDatabase()`    |
| `sorter/utils/file-ops.utils.ts`              | `getUniqueFileName`, `writeFileTo`, `applyAssign` (copy/cut)                              |
| `sorter/utils/folder-name.utils.ts`           | `validateFolderName` → `{ok, name | reason}` (alasan berbahasa Indonesia)                 |
| `media/config/file-formats.ts`                | Registry format (`getFileFormatInfo`, `isPreviewable`, `isSupportedImage`)                |
| `media/services/metadata.service.ts`          | ExifReader untuk gambar, mediainfo.js untuk video, `parseCaptureDate`, helper format      |
| `media/services/raw-decoder.service.ts`       | `decodeRawImage`, `decodeRawThumbnail`, `patchLibRawWorker`                               |
| `shared/stores/status.store.ts`               | Toast; helper biasa untuk kode non-React                                                  |

### 11.5 Skema database `nata-sort-db.json`

```jsonc
{
  "version": "2.0",
  "folders": [{ "id": "uuid", "name": "Keep", "shortcut": "1", "color": "bg-red-500", "createdAt": 0 }],
  "sortedPhotos": { "IMG_0001.jpg": "<folderId>" },   // kunci = nama file, bukan indeks
  "moveMode": "copy",                                  // "copy" | "cut"
  "currentIndex": 0,
  "operations": [{ "photoName": "", "folderId": "", "folderName": "", "mode": "copy",
                   "success": true, "error": "", "timestamp": 0 }],
  "metadataCache": { "IMG_0001.jpg": { /* PhotoMetadata */ } },
  "stats": { "totalPhotos": 0, "sortedCount": 0, "successOperations": 0, "failedOperations": 0 },
  "timestamp": 0
}
```

- **Tidak ada handle atau objek `File`** yang disimpan.
- **Penulis tunggal:** setiap mutasi adalah read-modify-write lewat `enqueue`/`writeChain`; task yang gagal tidak membuat rantai macet. Pembaruan sortir menggabungkan delta (`sortedPatch`), tidak menimpa total. Tulis: `createWritable → write → close`.
- **Jalur load:** `JSON.parse` (try/catch) → `isValidState` → cek versi → `sanitizeState`.
- **`sanitizeState`:** membuang kunci `__proto__`, `constructor`, `prototype` (objek null-prototype via `safeRecord`); membatasi koleksi (lihat Bagian 10); memaksa `moveMode` menjadi `"cut"` hanya bila tepat `"cut"`; `currentIndex` bilangan bulat ≥ 0.
- **Kebijakan versi:** tidak ada migrasi; perubahan versi = reset keras. File lama `photo-sorter-db.json` **tidak dibaca**; ganti nama manual untuk mempertahankan progres.

---

## 12. Keamanan dan privasi

### 12.1 Model kepercayaan

- Tidak ada logika aplikasi di server → tidak ada permukaan injeksi, SSRF, autentikasi, atau sesi.
- Tidak ada egress: `connect-src` dibatasi `'self' blob: data:`.
- Akses file dibatasi pada folder yang dipilih pengguna.
- **Input tak tepercaya:** file media, `nata-sort-db.json` (ada di folder yang dapat ditulis pengguna), nama folder yang diketik, dan rantai pasok dependensi.
- Tanpa cookie, tanpa rahasia, tanpa `dangerouslySetInnerHTML`/`innerHTML`/`eval`; React meng-escape semua output.

### 12.2 Content-Security-Policy

Diterapkan oleh helmet (`useDefaults:false`) dan identik di `firebase.json`:

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self';
img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self' data:;
style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval';
worker-src 'self' blob:; connect-src 'self' blob: data:; manifest-src 'self';
upgrade-insecure-requests
```

`script-src` tanpa `unsafe-inline`/`unsafe-eval` (hanya `wasm-unsafe-eval` untuk WASM). `style-src 'unsafe-inline'` adalah risiko yang diterima (Tailwind dan gaya runtime).

### 12.3 Header lain

| Header                                | Nilai                                           |
| ------------------------------------- | ----------------------------------------------- |
| Cross-Origin-Opener-Policy            | `same-origin`                                   |
| Cross-Origin-Embedder-Policy          | `require-corp`                                  |
| Cross-Origin-Resource-Policy          | `same-origin`                                   |
| Strict-Transport-Security             | `max-age=63072000; includeSubDomains; preload` (efektif hanya via HTTPS) |
| Referrer-Policy                       | `no-referrer`                                   |
| X-Content-Type-Options                | `nosniff`                                       |
| X-Frame-Options                       | `DENY`                                          |
| X-Permitted-Cross-Domain-Policies     | `none`                                          |
| X-DNS-Prefetch-Control                | `off`                                           |
| X-Download-Options                    | `noopen`                                        |
| Origin-Agent-Cluster                  | `?1`                                            |
| X-XSS-Protection                      | `0`                                             |
| Permissions-Policy                    | Menolak 19 fitur (camera, microphone, geolocation, usb, serial, payment, midi, dst.); hanya `fullscreen=(self)` dan `picture-in-picture=(self)` diizinkan |

Cross-origin isolation (COOP+COEP+CORP) dibutuhkan agar worker WASM dapat memakai `SharedArrayBuffer`.

### 12.4 Kontrol sisi klien

- `sanitizeState` / `safeRecord` dan batas koleksi (Bagian 11.5).
- `validateFolderName` (Bagian 6.10).
- Dekode dibatasi (Bagian 10): header EXIF 2 MB, kandidat 40 MB, 80 MB dekode penuh, timeout 20 detik, worker di-terminate.
- SVG hanya via `<img src=blob:>`; blob URL dicabut saat reload/unmount.
- Log operasi bebas handle. Default Copy; tak pernah menimpa; semua bisa di-undo.

### 12.5 Dependensi dan pelaporan

- `pnpm audit` (penuh dan `--prod`) dilaporkan bersih _(per docs v2.0.1)_. Advisory yang sudah ditutup: ExifReader GHSA-h64w-w9pr-82m4 (HIGH, tag ICC `mluc` buatan) dan GHSA-rr89-w3h9-m66j (MODERATE, dekompresi metadata tak terbatas). CLI `shadcn` dipindah ke devDependencies.
- Override transitif dev-only ada di `pnpm-workspace.yaml`.
- Image produksi hanya memuat `express`, `helmet`, `compression`.
- **Pelaporan:** GitHub private advisory; `public/.well-known/security.txt` (RFC 9116) dengan `Expires: 2027-01-01`, `Preferred-Languages: id, en`. **Perlu diperbarui sebelum Januari 2027.**
- **Rekomendasi operator:** pin image dengan digest, jalankan Trivy/`docker scout`, hanya HTTPS, pertimbangkan HSTS preload, jangan tambah sumber lintas-origin ke CSP.

---

## 13. Deployment dan operasi

### 13.1 Opsi deployment

| Opsi                       | Perintah / catatan                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **A. Docker Compose (disarankan)** | `docker compose up -d --build` → http://localhost:8080                                                     |
| B. Docker biasa            | `docker build -t nata-sort .` lalu `docker run --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges -p 8080:8080 nata-sort` |
| C. Firebase Hosting        | `pnpm build` lalu `firebase deploy --only hosting` (site `sastrala-phoso`, `public: dist`, header identik dengan server Node, HTTPS bawaan sehingga HSTS efektif) |
| D. Dari source             | `pnpm build; cd server && npm install --omit=dev; STATIC_DIR=../dist PORT=8080 node index.js`                       |

### 13.2 Dockerfile (3 tahap)

1. **build** — `node:22-slim`, corepack + pnpm `9.15.9`, `pnpm install --frozen-lockfile`, `pnpm run build`.
2. **server-deps** — `node:22-alpine`, `npm ci --omit=dev` dari `server/package-lock.json`.
3. **runtime** — `node:22-alpine`; `NODE_ENV=production`, `PORT=8080`, `HOST=0.0.0.0`; user `node` (non-root); `EXPOSE 8080`; `HEALTHCHECK` tiap 30 s (timeout 5 s, start 10 s, 3 retry) ke `/healthz`; `CMD ["node","index.js"]`.

### 13.3 docker-compose.yml (pengerasan)

Service `web` (image `nata-sort:latest`, container `nata-sort`), `restart: unless-stopped`, `init: true`, port `8080:8080`, `read_only: true`, tmpfs `/tmp` (16 MB), `no-new-privileges`, `cap_drop: ALL`, batas 1,0 CPU / 256 MB (cadangan 64 MB), log `json-file` 10 MB × 3. `TRUST_PROXY: "1"` tersedia sebagai baris komentar.

### 13.4 Variabel lingkungan (`server/index.js`)

| Variabel      | Default      | Catatan                                                                                                    |
| ------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| `PORT`        | `8080`       |                                                                                                            |
| `HOST`        | `0.0.0.0`    |                                                                                                            |
| `STATIC_DIR`  | `./public`   | `../dist` bila dijalankan dari source                                                                      |
| `TRUST_PROXY` | nonaktif     | `false`, `0`, kosong = mati; nilai lain diteruskan ke Express (`1`, `true`, `loopback`, daftar IP). Set hanya di belakang proxy TLS tepercaya. |

Aplikasi front-end sendiri **tidak membaca env var** dan tidak punya rahasia.

### 13.5 Perilaku server

- `x-powered-by` dimatikan; ETag kuat; `compression()`.
- Hanya `GET`/`HEAD` (selain itu 405 dengan `Allow: GET, HEAD`).
- `/healthz` → `ok`; `/.well-known/security.txt` disajikan (`dotfiles:"allow"`).
- `.wasm` → `application/wasm`; `.webmanifest` → `application/manifest+json`.
- `/assets/*` immutable setahun (`public, max-age=31536000, immutable`); HTML, `sw.js`, manifest → `no-cache`.
- Fallback SPA mengembalikan `index.html` untuk navigasi; path di bawah `/assets/` atau ber-ekstensi yang tak ada → 404 asli.
- Shutdown anggun pada SIGTERM/SIGINT (paksa keluar setelah 10 detik).
- Log awal: `[nata-sort] serving <dir> on http://HOST:PORT`.
- Kontainer berbicara HTTP biasa: terminasikan TLS di edge (Cloudflare, load balancer, Caddy, Traefik) dan set `TRUST_PROXY=1`.

### 13.6 Verifikasi dan troubleshooting

```bash
curl -sSD - http://localhost:8080/ -o /dev/null     # periksa header
curl http://localhost:8080/healthz                  # → ok
curl -X POST http://localhost:8080/ -i              # → 405
curl -i http://localhost:8080/assets/x.js           # → 404
```

| Gejala                                   | Penyebab / tindakan                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| "SharedArrayBuffer is not defined"       | COOP/COEP hilang atau dibuang proxy. Pastikan `self.crossOriginIsolated === true`.            |
| Metadata video kosong                    | Keterbatasan diketahui: WASM mediainfo tidak ter-emit saat build.                            |
| Folder tak bisa dibuka                   | Bukan Chromium, atau bukan secure context (butuh HTTPS atau localhost).                      |
| Progres hilang setelah rename ke NATA    | Ganti nama `photo-sorter-db.json` menjadi `nata-sort-db.json`.                               |

---

## 14. Desain dan UX

### 14.1 Prinsip UI

Utilitarian, mengutamakan konten, keyboard-first, kanvas netral dengan warna sebagai sinyal, gerak minimal, **gelap secara default**. Tanpa font web kustom (stack sans platform) sehingga `font-src 'self' data:` cukup. Ikon hanya `lucide-react` (`size-4`).

### 14.2 Token tema (OKLCH, `src/app/styles/globals.css`)

| Token                  | Terang                      | Gelap                       |
| ---------------------- | --------------------------- | --------------------------- |
| background             | `oklch(1 0 0)`              | `oklch(0.145 0 0)`          |
| foreground             | `oklch(0.145 0 0)`          | `oklch(0.985 0 0)`          |
| card / popover         | `oklch(1 0 0)`              | `oklch(0.205 0 0)`          |
| primary                | `oklch(0.205 0 0)`          | `oklch(0.922 0 0)`          |
| secondary / muted / accent | `oklch(0.97 0 0)`       | `oklch(0.269 0 0)`          |
| muted-foreground       | `oklch(0.556 0 0)`          | `oklch(0.708 0 0)`          |
| destructive            | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| border / input         | `oklch(0.922 0 0)`          | `oklch(0.269 0 0)`          |
| ring                   | `oklch(0.708 0 0)`          | `oklch(0.556 0 0)`          |

Radius dasar `0.625rem` (10 px); skala sm ×0,6 · md ×0,8 · lg ×1 · xl ×1,4 · 2xl ×1,8 · 3xl ×2,2 · 4xl ×2,6. Warna manifest PWA `#0a0f1a` berbeda dari warna dalam aplikasi.

### 14.3 Layout responsif

| Lebar             | Layout                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| < 768 px          | Satu kolom; `MobileActionBar` tetap di bawah (blur, satu tombol berwarna per folder, dapat digulir); swipe 50 px |
| ≥ 768 px (`md`)   | Satu kolom; chevron di sisi viewer; tanpa bar bawah                                                            |
| ≥ 1024 px (`lg`)  | Grid 12 kolom: viewer `col-span-8`, sidebar lengket `col-span-4` (`top-24`) berisi `FolderManager`, `MetadataPanel`, `OperationLog`, `Stats` |

Navbar lengket `z-50`, `backdrop-blur-xl`, `max-w-7xl`; berisi logo (`/icon.png`), versi, `StatusIndicator`, tombol `?`, `ThemeToggle`. Media dibatasi `max-h-[75vh]` dengan `object-contain`.

### 14.4 State UI

Kosong ("Mulai Sortir Foto" + "Pilih Folder Foto"), memuat ("Membaca…", "Memuat folder Project…"), gambar, video, mendekode RAW, preview tidak tersedia, semua tersortir (alert hijau), error (alert merah), error fatal (ErrorBoundary), 404 ("Halaman tidak ditemukan").

### 14.5 Komponen UI in-house (`shared/components/ui`)

alert, badge, button, card, dialog, empty, field, input, item, kbd, label, progress, scroll-area, separator, spinner, tabs. Tombol: varian default/outline/secondary/ghost/destructive/link; ukuran default (h-8)/xs/sm/lg (h-9)/icon/icon-xs/icon-sm/icon-lg. README menyatakan **tanpa dependensi Radix/shadcn**.

### 14.6 Aksesibilitas

- Ada: `aria-label` pada tombol ikon dan folder, `sr-only` pada toggle tema, `alt` default nama file, ring fokus, `role="status"`/aria-live untuk toast, operasi penuh dengan keyboard.
- **Celah:** viewport `maximum-scale=1, user-scalable=no` _(per UI-Design)_ membatasi zoom pengguna (perhatian WCAG 1.4.4/1.4.10); tidak ada guard `prefers-reduced-motion`; kontras tombol folder kuning/teal berteks putih paling lemah.

### 14.7 Bahasa

Seluruh teks UI adalah Bahasa Indonesia, inline di komponen. Tanggal memakai locale `id-ID` dan tidak bisa diubah. Tidak ada kerangka i18n.

---

## 15. Kualitas dan pengujian

### 15.1 Skrip npm

| Skrip                | Perintah                                         |
| -------------------- | ------------------------------------------------ |
| `dev`                | `vite`                                           |
| `build`              | `tsc -b && vite build`                           |
| `preview`            | `vite preview`                                   |
| `lint` / `lint:fix`  | `eslint .` / `eslint . --fix`                    |
| `format` / `format:check` | `prettier --write .` / `prettier --check .` |
| `typecheck`          | `tsc -b`                                         |
| `check:architecture` | `node scripts/check-architecture.mjs`            |
| `test`               | `vitest run`                                     |
| `test:watch`         | `vitest`                                         |
| `test:unit`          | `vitest run --project unit`                      |
| `test:integration`   | `vitest run --project integration`               |
| `test:e2e`           | `playwright test`                                |
| `test:all`           | `vitest run && playwright test`                  |

### 15.2 Strategi pengujian

- Tes diletakkan di samping fitur: `src/**/tests/{unit-test,integration-test,e2e-test}/`.
- **Vitest:** dua project (`unit`, `integration`), `jsdom`, `setupFiles: src/test/setup.ts`, `restoreMocks: true`. Mock File System Access ada di `src/test/global-mocks/file-system.ts`.
- **Playwright:** Chromium (Desktop Chrome) saja, `testDir: src`, `fullyParallel`; `webServer` menjalankan `pnpm build && pnpm preview --port 4173 --strictPort` (timeout 180 s); di CI `forbidOnly` dan `retries: 1`; trace dipertahankan saat gagal.
- **Cakupan saat ini** (hitungan kasar dari pemanggilan `it`/`test`): ±47 tes — ±37 Vitest (9 unit, 2 integration) dan ±10 Playwright dalam 4 spec. Tes parameter mungkin terhitung kurang.

| Jenis       | File (jumlah tes)                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | `route-discovery` (4), `HelpPage` (2), `file-formats` (2), `metadata-format` (1), `FolderManager` (4), `file-ops` (5), `folder-name` (2), `dialog` (4), `tabs` (4) |
| Integration | `app-router` (5), `project-db` (4)                                                                                                                      |
| E2E         | `navigation` (2), `sorting-flow` (5), `welcome` (2), `help` (1)                                                                                         |

- **Tidak ada** ambang atau tooling coverage.
- **Gerbang statis:** `tsc -b`, ESLint (typescript-eslint, react-hooks, react-refresh, jsdoc dengan `require-param` warn, aturan batas layer), Prettier, `check:architecture`, `pnpm audit`.
- **Pemeriksaan manual** _(docs/TDD.md)_: alur buka folder, Copy/Cut dengan tabrakan `_1` yang dipaksa, undo kedua mode, penolakan nama folder, jalur RAW, reset DB akibat korup/downgrade.

### 15.3 Definition of Done

`pnpm lint` dan `pnpm build` lulus; `pnpm audit` bersih (penuh dan `--prod`); privasi terjaga; input tetap zero-trust; header/CSP utuh; keselamatan data terjaga; kegagalan terkurung pada satu file; performa, aksesibilitas, responsif; maintainable; **dokumen diperbarui** (README, CHANGELOG, ARCHITECTURE, SECURITY, DEPLOYMENT sesuai relevansi). Kode, komentar, README, CHANGELOG berbahasa Inggris.

---

## 16. Tech stack dan dependensi

Versi dari `package.json` aktual. Node `>=22.23.4`, pnpm `>=12.0.0` (lihat [Bagian 21](#21-ketidakkonsistenan-dokumen-vs-kode) tentang pnpm). Paket `nata-sort` v2.2.0, ESM, `private: true`.

**Runtime**

| Paket                            | Versi    | Fungsi                                  |
| -------------------------------- | -------- | --------------------------------------- |
| react, react-dom                 | ^19.3.1  | UI                                      |
| react-router                     | ^8.5.0   | Routing                                 |
| zustand                          | ^5.0.16  | Store toast                             |
| exifreader                       | ^4.51.0  | EXIF gambar                             |
| libraw-wasm                      | ^1.6.0   | Dekode RAW (WASM ≈ 1,3 MB)              |
| mediainfo.js                     | ^0.3.8   | Metadata video                          |
| lucide-react                     | ^1.61.0  | Ikon                                    |
| tailwind-merge, clsx, class-variance-authority | ^3.7.0 / ^2.1.1 / ^0.7.1 | Utilitas kelas |
| tw-animate-css                   | ^1.4.0   | Animasi                                 |
| embla-carousel-react             | ^8.6.0   | Carousel                                |
| lodash.debounce                  | ^4.0.8   | Debounce                                |

**Build, kualitas, test (dev):** vite ^8.3.5 (rolldown), @vitejs/plugin-react ^6.1.2, tailwindcss + @tailwindcss/vite ^4.3.3, vite-plugin-pwa ^1.3.0, typescript ~6.0.3, vitest ^5.0.5, jsdom ^30.1.3, @playwright/test ~1.63.0, @testing-library/react ^16.3.3 · user-event ^14.6.8 · jest-dom ^7.0.1, eslint ^10.13.0 (+ typescript-eslint ^8.72.0, react-hooks ^7.1.1, react-refresh ^0.5.7, jsdoc ^65.4.1), prettier ^3.9.10.

**Server (`server/package.json`, `nata-sort-server` 1.0.0, versi dipaku persis):** express 5.2.1, helmet 8.3.0, compression 1.8.1.

**`pnpm-workspace.yaml`:** `allowBuilds: exifreader, msw`; override: `@babel/core@<7.29.6 → >=7.29.6 <8`, `vite@<8.0.16 → >=8.0.16`, `brace-expansion@>=5.0.0 <5.0.6 → >=5.0.6`.

**Vite:** plugin react, tailwindcss, VitePWA; alias `@ → src`; `optimizeDeps.exclude: ["mediainfo.js"]`; dev server mengirim COOP `same-origin` dan COEP `require-corp`.

---

## 17. Metrik keberhasilan

Sengaja **tanpa telemetri**. Metrik berasal dari studi usability opt-in, benchmark, dan sinyal komunitas.

| KPI                                         | Target                                  |
| ------------------------------------------- | --------------------------------------- |
| Time-to-first-sort                          | ≤ 15 detik untuk pengguna yang kembali  |
| Kecepatan sortir                            | ≥ 20 file/menit                         |
| Penekanan tombol per sortir                 | 1                                       |
| Insiden timpa diam-diam                     | 0                                       |
| Insiden kehilangan data                     | 0                                       |
| Keberhasilan undo dalam jendela 20 entri    | 100%                                    |
| Tingkat decode RAW macet                    | ≈ 0                                     |
| Pemulihan DB korup                          | 100%                                    |
| Keberhasilan buka folder di browser didukung| 100%                                    |
| Kerentanan diketahui                        | 0                                       |
| Kesesuaian header/CSP                       | 100%                                    |
| Byte media pengguna keluar perangkat        | 0                                       |
| Penyelesaian tugas ("semua tersortir")      | ≥ 90% pada uji usability                |
| Kepuasan kualitatif                         | Positif; "cepat" dan "privat" jadi tema utama |
| Tingkat instal PWA                          | Cenderung naik                          |

> **Pertanyaan terbuka:** PRD menyebut metrik dikumpulkan "secara eksternal" tetapi belum mendefinisikan prosesnya.

---

## 18. Roadmap dan backlog

### 18.1 Prioritas MoSCoW

| Kelas      | Isi                                                                                                                                                                                    | Status      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Must**   | Buka folder tanpa upload; scan level atas; urutan kronologis; preview raster/SVG; preview RAW + fallback; preview video; `1`–`9` + auto-advance; Copy/Cut; tulis anti-tabrakan; undo ≤ 20; kelola folder bernama tervalidasi; DB auto-save; reset DB korup; navigasi keyboard dengan penjaga mengetik; CSP dan header ketat | Semua shipped |
| **Should** | Panel metadata; metadata malas ter-cache; `U` + state semua tersortir; PWA; log ≤ 50 + statistik; layout responsif; tema; degradasi anggun metadata video; retry preview gambar            | Semua shipped |
| **Could**  | Redo (FR-C1); > 9 pintasan (FR-C2); filing massal (FR-C3 — **sudah shipped sebagai batch sort**); decode HEIC (FR-C4); rating/flag/tag (FR-C5); scan rekursif opsional (FR-C6); ekspor/impor DB atau laporan sortir (FR-C7) | Sebagian    |
| **Won't**  | Cloud; editing; Firefox/Safari; pemrosesan server; DAM penuh                                                                                                                           | —           |

### 18.2 Indikasi urutan (tidak mengikat)

Semua item wajib mempertahankan "tanpa upload, tanpa telemetri, local-first".

- **Dekat:** redo; ekspor laporan sortir.
- **Menengah:** skema pintasan > 9 folder; preview HEIC bila ada dekoder in-browser yang layak.
- **Nanti:** scan rekursif di balik toggle; flag/tag ringan.
- **Backlog:** jendela riwayat reversibel diperluas; aksesibilitas lanjutan (alur screen-reader, tema kontras tinggi); lokalisasi di luar Indonesia.

### 18.3 Usulan dari analisis ini (belum disetujui)

1. Tambahkan konfirmasi sebelum menghapus folder tujuan, atau ubah menjadi "lepas dari daftar" tanpa menghapus isi disk.
2. Cadangkan DB lama sebelum di-reset karena korup/versi beda.
3. Batalkan `user-scalable=no` pada viewport; tambahkan guard `prefers-reduced-motion`.
4. Biarkan `ThemeToggle` menyediakan opsi "sistem" dan mengikuti perubahan OS.
5. Pertimbangkan membatasi pembacaan file RAW (saat ini seluruh file dibaca ke memori).
6. Selaraskan dokumen `docs/*` dan aturan i18n di CLAUDE.md dengan kode ([Bagian 21](#21-ketidakkonsistenan-dokumen-vs-kode)).

---

## 19. Riwayat versi

| Versi          | Tanggal                | Perubahan utama                                                                                                                                             |
| -------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0          | Tidak tercatat di CHANGELOG | Buka folder, preview gambar, Copy/Cut ke folder, pintasan angka (disimpulkan)                                                                          |
| 1.1.0          | 2025-05                | Preview + metadata video (mediainfo.js); migrasi ke shadcn/Radix dan store status Zustand; perbaikan DB yang ter-reset saat project dimuat ulang           |
| **2.0.0**      | 2026-06-14             | **Breaking:** skema DB `2.0` (DB lama direset). Tambah: urutan kronologis, undo, `U`, state semua tersortir, PWA/offline, metadata malas, retry gambar, tabrakan nama, header keamanan + CSP, Docker, ErrorBoundary. Ubah: pemetaan berdasarkan nama file, log operasi serializable, preview RAW dari JPEG tertanam terbesar. Perbaiki: desinkronisasi setelah cut+reload, handle basi, retry RAW tak berhingga, pintasan saat mengetik, foto pertama tak bisa disortir di mobile, race toast, nama folder duplikat/invalid |
| 2.0.1          | 2026-06-14             | Penguatan RAW: perbaikan hang worker libraw ("n is not a function"), potongan ARW terpotong, tambal worker, timeout 20 s + terminate, fallback `thumbnailData()`, preview JPEG ter-bounded, libraw-wasm ^1.4.0 |
| **2.1.0**      | 2026-07-14             | Keamanan (audit bersih, ExifReader ^4.41.0, pengerasan jalur load DB, nama folder lebih ketat, `security.txt`, `firebase.json`), deployment (nginx dihapus → Express + helmet di `node:22-alpine`, compose dikeraskan), kualitas kode (enam prinsip, `mutateDatabase()`, `megapixelsFrom()`, Prettier), fitur (filmstrip/grid, zoom+loupe, multi-select + batch sort, dialog pintasan `?`, set `docs/` lengkap) |
| 2.2.0          | 2026-07-15             | Grid lazy-render dengan append-on-scroll + loader; pintasan grid `Ctrl/Cmd+A`, `Shift+klik`, `Esc`; filmstrip dan grid di dalam `ScrollArea`                  |
| _Unreleased_   | —                      | Rename ke **NATA / `nata-sort`**: paket, server, image/container Docker, tag log. Kunci tema → `nata-sort-theme` (tema ter-reset sekali). File state → `nata-sort-db.json` (`photo-sorter-db.json` lama tidak dibaca). Refactor ke arsitektur berbasis fitur + route discovery + `/help` + suite tes |

Skema DB tetap `"2.0"` sepanjang 2.0 → 2.2.

---

## 20. Risiko, keterbatasan, dan known issues

| #   | Item                                                                                                                                                    | Dampak / mitigasi saat ini                                                              | Tingkat   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------- |
| R1  | **Menghapus folder tujuan = `removeEntry(recursive:true)` tanpa konfirmasi** — isi (file yang sudah disortir) ikut terhapus dari disk                    | Risiko kehilangan data; bertentangan dengan prinsip "aksi destruktif harus bisa di-undo" | **Tinggi** |
| R2  | DB korup / versi beda **ditimpa tanpa backup**                                                                                                          | Progres lama hilang                                                                      | Sedang    |
| R3  | Undo hanya untuk sesi berjalan (20 entri, memori)                                                                                                       | Setelah reload sortir lama tak bisa dibalik                                              | Sedang    |
| R4  | Sortir ulang foto yang sudah tersortir meninggalkan salinan lama                                                                                        | Duplikat di folder sebelumnya                                                            | Rendah    |
| R5  | Hanya Chromium; butuh secure context                                                                                                                    | Firefox/Safari tak bisa memakai app                                                      | Diterima  |
| R6  | HEIC/HEIF tidak bisa di-preview                                                                                                                         | Tetap bisa disortir                                                                      | Diterima  |
| R7  | Preview video bergantung codec browser/OS                                                                                                               | AVI/WMV/MKV/FLV bisa tidak terputar                                                      | Diterima  |
| R8  | WASM mediainfo tidak ter-emit saat build                                                                                                                | Metadata video default (durasi, codec kosong)                                            | Sedang    |
| R9  | Dekode RAW membaca **seluruh file** via `arrayBuffer()`; jalur JPEG tertanam tanpa batas byte                                                           | RAW sangat besar dapat memakai banyak memori                                             | Sedang    |
| R10 | Tidak ada batas ukuran file / jumlah item saat scan; setiap file di-`getFile()`                                                                         | Folder sangat besar bisa lambat                                                          | Rendah    |
| R11 | `.ts` dianggap video                                                                                                                                    | File TypeScript di folder ikut terdaftar                                                 | Rendah    |
| R12 | Pintasan sortir/navigasi tidak aktif di grid view                                                                                                       | Bisa membingungkan; tidak didokumentasikan di README                                     | Rendah    |
| R13 | Nomor pintasan tak diatur ulang setelah folder dihapus; folder ke-10+ tanpa pintasan                                                                    | Celah penomoran                                                                          | Rendah    |
| R14 | `style-src 'unsafe-inline'`                                                                                                                             | Risiko diterima (Tailwind/gaya runtime)                                                  | Diterima  |
| R15 | Viewport mematikan zoom pengguna; tidak ada `prefers-reduced-motion`                                                                                    | Celah aksesibilitas                                                                      | Sedang    |
| R16 | `ThemeToggle` tak bisa kembali ke "system"; "system" tak mengikuti perubahan OS                                                                         | UX kecil                                                                                 | Rendah    |
| R17 | Tanggal metadata selalu `id-ID`; komentar kode menyarankan `en-US` untuk Inggris                                                                        | Tak berubah mengikuti bahasa (memang tak ada pilihan bahasa)                             | Rendah    |
| R18 | `security.txt` kedaluwarsa 2027-01-01                                                                                                                   | Perlu diperbarui berkala                                                                 | Rendah    |
| R19 | Folder DB tidak menyimpan handle; setelah reload pengguna harus membuka folder lagi                                                                     | Perilaku normal API; penjaga keluar halaman membantu                                     | Info      |
| R20 | Kegagalan tulis metadata ke DB diam-diam                                                                                                                | Cache bisa tak tersimpan tanpa peringatan                                                | Rendah    |

---

## 21. Ketidakkonsistenan dokumen vs kode

| #   | Topik                      | Klaim di dokumen                                                                                                              | Kenyataan di kode                                                                                                  | Rekomendasi                                                             |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 1   | Versi                      | PRD/SPEC/PRINCIPLES/ARCHITECTURE/TDD: v2.0.1, 2026-07-14                                                                      | `package.json` 2.2.0; CHANGELOG 2.1.0 (07-14), 2.2.0 (07-15), Unreleased                                           | Naikkan versi dan sinkronkan isi                                        |
| 2   | Routing                    | "Tanpa router, single view"; `main.tsx` menormalkan path ke `/`                                                               | react-router 8, route discovery, `/help`, halaman 404                                                              | Hapus klaim "no router" dari PRD/SPEC/PRINCIPLES/ARCHITECTURE           |
| 3   | Struktur sumber            | Path datar: `src/hooks/useFileSystem.ts`, `src/services/*`, `src/config/fileFormats.ts`, `src/stores/statusStore.ts`, `src/lib/safeName.ts`, `src/components/*` | `app/ features/{sorter,media,help}/ shared/`, nama kebab-case (`project-db.service.ts`, `file-formats.ts`, `folder-name.utils.ts`, …) | Perbarui peta file di docs; aturan proyek menyebut `fileFormats.ts` padahal file-nya `file-formats.ts` |
| 4   | UI library                 | PRD/SPEC/PRINCIPLES/CHANGELOG: shadcn/Radix; TDD mencantumkan `radix-ui`, `shadcn`, `lodash.isempty`                           | Tidak ada paket `radix-ui`/`shadcn`/`lodash.isempty` di `package.json`; primitif in-house (README menegaskan)       | Koreksi docs                                                            |
| 5   | i18n                       | `.claude/CLAUDE.md` proyek: tambah key ke `src/shared/i18n/language/en.json` dan `id.json`, render dengan `t()`               | Folder i18n **tidak ada**, tidak ada `i18next`; string inline Indonesia                                            | Hapus/ubah aturan di CLAUDE.md, atau putuskan membangun i18n            |
| 6   | Pengujian                  | TDD §14: belum ada suite unit; E2E "masa depan"                                                                               | ±47 tes (Vitest + Playwright), `check:architecture`                                                                | Tulis ulang bagian testing di TDD                                       |
| 7   | Batch / filmstrip / grid / zoom / dialog pintasan | PRD: bulk filing = Could; PRD/SPEC tidak menyebut filmstrip, grid, loupe, `?`, shortcut grid                       | Semua sudah shipped (2.1.0/2.2.0)                                                                                  | Tambahkan ke PRD/SPEC; SPEC undo harus menyebut batch = 1 entri         |
| 8   | Toolchain                  | Docs: Node 22+, pnpm 9; Dockerfile pin pnpm `9.15.9`                                                                          | `engines`: node `>=22.23.4`, pnpm `>=12.0.0`                                                                       | Verifikasi nilai `pnpm >=12.0.0` dan samakan dengan Dockerfile          |
| 9   | Versi dependensi           | TDD: React ^19.2.5, Vite ^8.1.4, Tailwind ^4.2.4, exifreader ^4.41.0, libraw-wasm ^1.4.0, mediainfo.js ^0.3.7                  | React ^19.3.1, Vite ^8.3.5, Tailwind ^4.3.3, exifreader ^4.51.0, libraw-wasm ^1.6.0, mediainfo.js ^0.3.8           | Perbarui                                                                |
| 10  | Lokasi `pnpm.overrides`    | Docs: di `package.json`                                                                                                       | Di `pnpm-workspace.yaml`                                                                                           | Koreksi; aturan "Keep `pnpm.overrides`" tetap berlaku                   |
| 11  | Nama file DB               | UI-Design: `.nata-sort-db.json` (titik di depan); CHANGELOG 2.0.0/PRD v2.0.0 menyebut nama baru padahal dulu `photo-sorter-db.json` | Kode: `nata-sort-db.json`                                                                                          | Koreksi typo; tandai catatan historis                                   |
| 12  | Field `moved`              | SPEC FR-SORT-2 dan PRINCIPLES masih menjelaskan `PhotoFile.moved`                                                              | CHANGELOG 2.1.0: field write-only itu dihapus                                                                      | Hapus dari SPEC/PRINCIPLES                                              |
| 13  | Dekode RAW                 | README: "dekode libraw-wasm resolusi penuh"                                                                                   | Setengah ukuran (`halfSize`), AHD, sRGB                                                                            | Koreksi README                                                          |
| 14  | Shortcut di README         | Tabel README tidak memuat `Ctrl/Cmd+A`, `Esc`, `Shift+klik`                                                                   | Ketiganya ada di kode dan CHANGELOG 2.2.0                                                                          | Tambahkan; jelaskan bahwa `1`–`9`/panah hanya single view               |
| 15  | Lokasi penanganan shortcut | SPEC: `ContentViewer.tsx`; PRINCIPLES: "app shell"                                                                            | `ContentViewer` (single view) dan `SorterPage` (grid)                                                              | Samakan                                                                 |
| 16  | Docker lama                | CHANGELOG 2.0.0: Docker multi-stage + nginx                                                                                   | nginx dihapus di 2.1.0 (Express + helmet)                                                                          | Biarkan sebagai sejarah, beri catatan                                   |
| 17  | Firebase                   | PRD NFR-D hanya menyebut Docker                                                                                               | `firebase.json` ada (site `sastrala-phoso`; `.firebaserc` proyek `sastrala-id`) — sisa nama proyek lama            | Tambahkan ke PRD; pastikan nama site/proyek memang dimaksudkan          |
| 18  | URL repo                   | `security.txt`/README: `frama21/photo-sorter`                                                                                 | Folder lokal `nata-photo`, brand NATA                                                                              | Sesuaikan bila remote sudah berubah                                     |
| 19  | Nama fungsi                | `isSupportedImage`                                                                                                            | Juga meloloskan video                                                                                              | Pertimbangkan rename (`isSupportedMedia`)                               |
| 20  | Ukuran server              | DEPLOYMENT: "~180 baris"                                                                                                      | `server/index.js` ±201 baris                                                                                       | Minor                                                                   |
| 21  | PRD internal               | G6 "tanpa instalasi" vs PWA yang dapat dipasang; exifreader "4.39.0" vs pin ^4.41.0                                            | Instal PWA bersifat opsional; versi terpasang jauh lebih baru                                                      | Perjelas redaksi                                                        |
| 22  | DESIGN.md vs UI-Design.md  | `DESIGN.md` adalah dokumen desain perangkat lunak/ADR                                                                         | Desain visual ada di `UI-Design.md`                                                                                | Tambahkan indeks `docs/`                                                |

> Working tree saat snapshot dalam keadaan **mid-rename** (banyak berkas termodifikasi belum di-commit), sehingga sebagian ketidakkonsistenan akan hilang saat perubahan disatukan.

---

## 22. FAQ dan pertanyaan terbuka

### 22.1 FAQ (untuk support)

**Apakah foto saya diunggah?** Tidak. Semua diproses di browser. CSP mengunci koneksi keluar, dan server hanya menyajikan file aplikasi.

**Browser apa yang didukung?** Chrome, Edge, Opera versi terbaru. Firefox dan Safari tidak punya File System Access API.

**Di mana progres saya disimpan?** Di `nata-sort-db.json` di dalam folder yang Anda buka. Hapus file itu untuk memulai dari awal.

**Saya memperbarui dan progres hilang?** Bila berasal dari versi sebelum rename NATA, ubah nama `photo-sorter-db.json` menjadi `nata-sort-db.json`.

**Apakah file asli bisa tertimpa?** Tidak. Bila nama sama, ditambah `_1`, `_2`, …. Default adalah Copy.

**Bagaimana membatalkan sortir?** `Ctrl/Cmd+Z` (hingga 20 langkah, selama sesi belum di-reload).

**Mengapa tombol angka tidak bekerja?** Pastikan Anda di tampilan tunggal (bukan grid), fokus tidak di kolom input, dan folder dengan nomor itu ada. Folder ke-10 dan seterusnya tidak punya pintasan.

**Mengapa foto HEIC tidak tampil?** Tidak ada dekoder HEIC in-browser; file tetap bisa disortir.

**Mengapa preview RAW lama atau buram?** Aplikasi mengambil JPEG tertanam terbesar; bila kecil (< 800 px) dan file ≤ 80 MB, dicoba dekode libraw (maks 20 detik). Sisanya memakai preview kecil.

**Apa yang terjadi bila saya menghapus folder tujuan?** Folder **dan isinya** dihapus dari disk tanpa konfirmasi. Hati-hati.

**Bisakah saya memakainya offline?** Ya, setelah dimuat sekali sebagai PWA. Pemrosesan file selalu lokal.

**Apakah ada versi bahasa Inggris?** Belum; UI hanya Bahasa Indonesia.

**Mengapa metadata video kosong?** Keterbatasan diketahui: modul WASM mediainfo tidak ikut dibuild.

### 22.2 Pertanyaan terbuka untuk Product Owner

1. Apakah penghapusan folder tujuan perlu dikonfirmasi atau diganti perilaku "lepas dari daftar"? (R1)
2. Bagaimana semantik undo batch relatif terhadap batas 20 entri bila batch sangat besar?
3. Apakah ada skema untuk > 9 tujuan (mis. `Shift+angka`, palet perintah)?
4. Apa kebijakan HEIC bila dekoder in-browser yang layak muncul?
5. Apakah redo, scan rekursif, atau tagging benar-benar diinginkan, atau tetap non-goal?
6. Bagaimana metrik dikumpulkan tanpa telemetri (siapa, kapan, dengan protokol apa)?
7. Apakah bahasa Inggris (atau lainnya) perlu didukung? Bila ya, kerangka i18n dan aturan CLAUDE.md harus dirancang.
8. Apakah dukungan mobile akan ditingkatkan dari "sekunder", mengingat ketergantungan pada API browser?
9. Apakah nilai `engines.pnpm >=12.0.0` benar, dan nama proyek/site Firebase serta URL repo perlu disesuaikan dengan brand NATA?
10. Apakah pintasan sortir perlu bekerja juga di grid view?

---

## 23. Glosarium dan peta sumber

### 23.1 Glosarium

| Istilah                     | Arti                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Folder akar / opened folder | Satu direktori yang dipilih pengguna (`FileSystemDirectoryHandle`)                                      |
| Foto / file / item          | Berkas gambar atau video level atas yang didukung. UI menyebut "foto"; tipe internal `PhotoFile`        |
| Folder tujuan / sort folder | Sub-folder di folder akar dengan warna dan pintasan 1–9 opsional (`SortFolder`)                         |
| Pintasan                    | Angka 1–9 yang terikat pada satu folder                                                                 |
| Copy / Cut                  | Mode salin (default) / pindah                                                                           |
| Kunci (key)                 | Nama file stabil untuk pemetaan ter-persist                                                             |
| Sorted mapping              | `{ fileName → folderId }`                                                                               |
| Operasi                     | Catatan `SortOperation` tanpa handle                                                                    |
| Undo stack                  | Tumpukan di memori, maks 20 entri                                                                       |
| Project database            | `nata-sort-db.json`, skema 2.0                                                                          |
| `createdName`               | Nama file yang benar-benar ditulis (dipakai undo)                                                       |
| Previewable                 | Browser dapat merender langsung                                                                         |
| Embedded preview            | JPEG yang disimpan kamera di dalam file RAW                                                             |
| SOI                         | Penanda awal JPEG `FF D8 FF`                                                                            |
| `writeChain` / `enqueue`    | Antrean promise penulis tunggal untuk DB                                                                |
| `sanitizeState` / `safeRecord` | Pembersih state DB dan pembuat objek null-prototype                                                  |
| Cross-origin isolation      | COOP + COEP + CORP                                                                                      |
| File System Access API      | API Chromium di balik `showDirectoryPicker`                                                             |
| PWA                         | Progressive Web App                                                                                     |
| FSD                         | Feature-Sliced Design (layer `app → features → shared`)                                                 |
| Loupe                       | Kaca pembesar bundar yang mengikuti kursor di desktop                                                   |
| Filmstrip                   | Strip thumbnail horizontal di bawah viewer                                                              |

### 23.2 Peta sumber di repositori

| Topik                                   | Lokasi                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Identitas dan konfigurasi app           | `src/app/config/app.config.ts`, `package.json`                                              |
| Rute dan layout                         | `src/app/routes/*`, `src/app/layouts/*`, `src/features/*/routes.ts`                          |
| Controller sortir (state, scan, undo)   | `src/features/sorter/hooks/useFileSystem.ts`                                                |
| Zoom/pan                                | `src/features/sorter/hooks/useZoomPan.ts`                                                   |
| Halaman dan komponen sortir             | `src/features/sorter/pages/SorterPage.tsx`, `src/features/sorter/components/*`              |
| DB proyek                               | `src/features/sorter/services/project-db.service.ts`                                        |
| Operasi file / validasi nama folder     | `src/features/sorter/utils/file-ops.utils.ts`, `folder-name.utils.ts`                       |
| Format, metadata, dekoder RAW           | `src/features/media/config/file-formats.ts`, `services/metadata.service.ts`, `services/raw-decoder.service.ts` |
| Halaman Bantuan                         | `src/features/help/pages/HelpPage.tsx`                                                      |
| Toast                                   | `src/shared/stores/status.store.ts`                                                         |
| Tema                                    | `src/app/providers/ThemeProvider.tsx`, `src/app/styles/globals.css`                          |
| Server statis dan header                | `server/index.js`, `firebase.json`                                                          |
| Build dan PWA                           | `vite.config.ts`                                                                            |
| Container                               | `Dockerfile`, `docker-compose.yml`                                                          |
| Penegak arsitektur                      | `scripts/check-architecture.mjs`, `eslint.config.js`                                        |
| Tes                                     | `src/**/tests/{unit-test,integration-test,e2e-test}/`, `playwright.config.ts`, `src/test/`  |
| Dokumen                                 | `README.md`, `CHANGELOG.md`, `docs/PRD.md` (produk), `SPEC.md` (spesifikasi), `PRINCIPLES.md` (prinsip), `ARCHITECTURE.md`, `DESIGN.md` (desain perangkat lunak/ADR), `UI-Design.md` (desain visual), `SECURITY.md`, `DEPLOYMENT.md`, `TDD.md` |
| Peta kode otomatis                      | `graphify-out/GRAPH_REPORT.md` (619 node, 1.308 edge, 49 komunitas; hub teratas: `cn()`, `react`, `Button()`, `useFileSystem()`) |

---

_Akhir dokumen. Perbarui berkas ini setiap kali ada perubahan perilaku produk, batas/konstanta, format, atau deployment — dan perbarui [Bagian 21](#21-ketidakkonsistenan-dokumen-vs-kode) saat ketidakkonsistenan diselesaikan._
