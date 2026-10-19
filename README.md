# SIAKAD - SMA Negeri 14 Kota Tidore Kepulauan

![React](https://img.shields.io/badge/React-19.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwindcss)
![Express](https://img.shields.io/badge/Backend-Express.js-000000?logo=express)
![License](https://img.shields.io/badge/License-MIT-green)

Aplikasi Web Sistem Informasi Akademik dan Manajemen Guru **SMA Negeri 14 Kota Tidore Kepulauan** berbasis Full-Stack (React 19, Tailwind CSS, TypeScript, Express Backend, Integrasi Google Apps Script & Google Sheets, serta Gemini AI untuk Kurikulum Merdeka).

---

## 🌟 Fitur Utama

### 1. Sistem Login & Multi-Role
- Pemisahan hak akses antara **Admin (Kepala Sekolah & Waka Kurikulum)** dan **Guru / Tenaga Kependidikan**.
- Tombol demo login cepat untuk mempermudah evaluasi:
  - **Admin**: `admin` / `admin123`
  - **Guru (Budi Santoso, S.Pd.)**: `budi` / `guru123`

### 2. Dasbor Admin (Kepala Sekolah / Waka Kurikulum)
- **Ringkasan Aktivitas**: Statistik total guru, kehadiran hari ini, berkas menunggu verifikasi, dan total supervisi.
- **Grafik Kelengkapan Perangkat Ajar**: Visualisasi capaian kelengkapan administrasi guru (Kurikulum Merdeka).
- **Supervisi Akademik & Pratinjau Terpisah**:
  - 📘 **ATP (Alur Tujuan Pembelajaran)**
  - 📗 **PROTA (Program Tahunan)**
  - 📙 **PROSEM (Program Semester)**
  - 📕 **Modul Ajar (Kurikulum Merdeka)**
  - Fitur telaah supervisi langsung (Disetujui / Perlu Revisi / Menunggu) dengan catatan pembinaan.
  - Pratinjau interaktif berkas tanpa kendala pemblokiran iframe.
- **Penilaian Supervisi Tatap Muka KBM**: Formulir dan tabel penilaian 4 kompetensi guru (Pedagogik, Profesional, Sosial, Kepribadian) dengan bantuan saran pembinaan AI.
- **Manajemen Pengguna (CRUD)**: Kelola akun guru/tendik, NIP, mapel, username, dan hak akses.
- **Pratinjau Kehadiran Real-time**: Rekapitulasi absensi harian guru.
- **Ekspor PDF Resmi**: Cetak dokumen laporan kehadiran, supervisi tatap muka, dan rekap perangkat ajar menggunakan `jsPDF`.
- **Pengaturan Identitas Sekolah**: Pengaturan nama sekolah, NPSN, nama kepala sekolah, dan tahun ajaran.
- **Audit Trail & Log Aktivitas Keamanan**: Rekam jejak seluruh riwayat autentikasi login (sukses & gagal), aplotan perangkat ajar, pencatatan KBM, dan telaah supervisi untuk meningkatkan keamanan dan akuntabilitas.

### 3. Dasbor Guru & Tenaga Kependidikan
- **Absensi Harian**: Form kehadiran (Hadir, Sakit, Izin) dengan pencatatan waktu otomatis.
- **Jurnal Mengajar Harian**: Pencatatan KBM harian (Mapel, Kelas, Materi Pembelajaran, Catatan Kelas).
- **Upload Perangkat Ajar**: Unggah berkas ATP, PROTA, PROSEM, Modul Ajar, Silabus (.pdf, .docx, .xlsx) yang tersimpan ke Google Drive.
- **✨ AI Asisten RPP**: Generator Modul Ajar instan berbasis Kurikulum Merdeka dengan Google Gemini AI.

### 4. Audit Trail & Log Keamanan
- Halaman inspeksi log forensik aktivitas pengguna dengan filter kategori (AUTH, DOKUMEN, SUPERVISI, ABSENSI, JURNAL, SISTEM), role, dan status.
- Dilengkapi pencarian IP address, modal inspeksi metadata JSON, dan tombol ekspor PDF resmi laporan audit keamanan.

### 5. Integrasi Google Apps Script (GAS) & Google Sheets
- Tab khusus yang menyajikan kode `Code.gs` lengkap (`doGet`, `doPost`, upload Drive, CRUD sheet) dan skema lembar kerja Spreadsheet (`Users`, `Absensi`, `Jurnal`, `Dokumen`, `Supervisi`).

---

## 🚀 Panduan Menyimpan / Push Proyek ke GitHub

Ikuti langkah-langkah berikut untuk menyimpan dan mempublikasikan kode ini ke repositori GitHub Anda:

### Langkah 1: Buat Repositori Baru di GitHub
1. Masuk ke akun GitHub Anda di [https://github.com](https://github.com).
2. Klik tombol **New** (Buat Repositori Baru).
3. Beri nama repositori, contoh: `siakad-sman14-tidore`.
4. Pilih **Public** atau **Private** sesuai kebutuhan.
5. Jangan centang "Initialize this repository with a README" (karena file sudah tersedia di proyek ini).
6. Klik **Create repository**.

### Langkah 2: Inisialisasi Git dan Push dari Komputer Anda
Buka terminal pada direktori proyek ini, lalu jalankan perintah berikut secara berurutan:

```bash
# 1. Inisialisasi git (jika belum)
git init

# 2. Tambahkan semua berkas ke git staging
git add .

# 3. Buat commit pertama
git commit -m "feat: inisialisasi aplikasi SIAKAD SMA Negeri 14 Kota Tidore Kepulauan"

# 4. Ubah branch utama menjadi main
git branch -M main

# 5. Hubungkan ke repositori GitHub Anda (ganti URL di bawah dengan URL repositori Anda)
git remote add origin https://github.com/USERNAME_ANDA/siakad-sman14-tidore.git

# 6. Push kode ke GitHub
git push -u origin main
```

*(Catatan: Ganti `USERNAME_ANDA` dengan username akun GitHub Anda).*

---

## 💻 Panduan Menjalankan Aplikasi Secara Lokal

### Prasyarat
- **Node.js** (versi 20.x ke atas direkomendasikan)
- **NPM** atau **Bun**

### Instalasi & Menjalankan

1. **Clone repositori**:
   ```bash
   git clone https://github.com/USERNAME_ANDA/siakad-sman14-tidore.git
   cd siakad-sman14-tidore
   ```

2. **Instal dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable**:
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan masukkan API Key Gemini Anda (opsional, aplikasi memiliki fallback bawaan):
   ```env
   GEMINI_API_KEY="AIzaSy..."
   APP_URL="http://localhost:3000"
   PORT=3000
   ```

4. **Jalankan server pengembangan (Dev)**:
   ```bash
   npm run dev
   ```
   Buka browser Anda di `http://localhost:3000`.

5. **Build untuk Produksi**:
   ```bash
   npm run build
   npm start
   ```

---

## 📁 Struktur Direktori Proyek

```text
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI otomatis
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx   # Dasbor admin & supervisi terpisah ATP/Prota/Prosem/Modul
│   │   ├── TeacherDashboard.tsx # Dasbor guru, absensi, jurnal & upload perangkat
│   │   ├── GasViewer.tsx        # Penampil kode Code.gs & skema spreadsheet
│   │   ├── LoginModal.tsx       # Sistem login multi-role dengan preset demo
│   │   └── Navbar.tsx           # Navigasi utama sekolah
│   ├── types.ts                 # TypeScript interfaces
│   ├── App.tsx                  # Komponen utama aplikasi
│   ├── main.tsx                 # Entry point frontend React
│   └── index.css                # Styling Tailwind CSS
├── .env.example                 # Contoh variabel lingkungan
├── .gitattributes               # Normalisasi line endings Git
├── .gitignore                   # Berkas yang diabaikan Git
├── index.html                   # HTML template dengan meta SMA N 14
├── LICENSE                      # Lisensi MIT
├── metadata.json                # Metadata aplikasi
├── package.json                 # Daftar dependensi & script
├── server.ts                    # Backend Express + Vite middleware + API
├── tsconfig.json                # Konfigurasi TypeScript
└── vite.config.ts               # Konfigurasi Vite & Tailwind
```

---

## 📄 Lisensi
Didistribusikan di bawah Lisensi MIT. Lihat berkas `LICENSE` untuk informasi lebih lanjut.

© 2026 **SMA Negeri 14 Kota Tidore Kepulauan** - Dinas Pendidikan Provinsi Maluku Utara.
