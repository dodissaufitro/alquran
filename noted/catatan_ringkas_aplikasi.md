# Catatan Ringkas Aplikasi Talaqee

Dokumen ini merangkum arsitektur, teknologi, alur kerja, dan informasi penting untuk pengembangan dan operasional aplikasi **Talaqee (Al-Quran Al-Haramain)**.

---

## 1. Ikhtisar Aplikasi
**Talaqee** adalah platform interaktif pembelajaran Al-Qur'an dan keislaman yang mencakup:
- **Talaqqi & Koreksi Bacaan**: Pengiriman rekaman tilawah/hafalan dan evaluasi ustadz/pembina.
- **Materi Kajian & Ulumul Qur'an**: Artikel, bab pembelajaran, tajwid, tafsir tahlili/tematik, dan jurnal eksklusif.
- **Sistem Koin & Langganan**: Akses materi premium menggunakan koin atau paket langganan.
- **Pertemuan & Jadwal (Meetings)**: Penjadwalan kajian publik maupun privat.

---

## 2. Bahasa Pemrograman & Tumpukan Teknologi (Tech Stack)

### A. Bahasa Pemrograman yang Digunakan
- **PHP (`^8.2`)**: Bahasa pemrograman utama untuk seluruh logika backend server, pemrosesan API, dan interaksi database.
- **TypeScript (`^5.x`) & JavaScript**: Bahasa utama untuk pengembangan antarmuka (frontend SPA) dan skrip build/tools Node.js.
- **SQL (MySQL)**: Bahasa query relasional untuk manajemen skema dan data santri, materi kajian, serta koin.
- **HTML5 & Vanilla CSS**: Untuk struktur antarmuka dan desain visual modular yang elegan tanpa ketergantungan utility framework yang berat.

### B. Frontend (React 19 / Vite)
- **Framework**: React 19 (`^19.2.6`) + TypeScript + Vite.
- **Entry Points**:
  - `index.html` → Aplikasi utama untuk santri/pengguna umum (`src/main.tsx`).
  - `admin.html` → Panel CMS Admin (`src/admin/main.tsx`).
- **Styling**: Vanilla CSS modular (`src/styles/`).

### C. Backend API (PHP 8.2+ / Laravel 12)
- **Framework**: Laravel 12 (`^12.0`) berjalankan PHP 8.2+.
- **Lokasi Folder**: `backend/`
- **Tanggung Jawab**:
  - **ORM & Database**: Eloquent Models (`backend/app/Models/`).
  - **API Routing**: Semua rute dikelola di `backend/routes/api.php`.
  - **CMS Controllers**: Berada di `backend/app/Http/Controllers/Api/Cms/` (menangani login admin, manajemen konten, upload sampul, daftar pengguna, dan koin).
  - **Web Redirects**: `backend/routes/web.php` secara otomatis mengarahkan akses root/admin ke halaman login CMS.

### D. Database (MySQL via Laragon)
- **Host**: `127.0.0.1:3306`
- **Nama Database**: `alquran`
- **Koneksi**: Terpusat menggunakan pool koneksi Laravel (`\Illuminate\Support\Facades\DB`).

---

## 3. Peta Akses & URL Penting

| Layanan / Halaman | URL Akses | Keterangan |
| :--- | :--- | :--- |
| **Aplikasi Utama (Dev)** | [http://localhost:5173/](http://localhost:5173/) | Frontend antarmuka santri/pengguna |
| **Panel Login CMS (Dev)** | [http://localhost:5173/admin.html](http://localhost:5173/admin.html) | Panel administrasi CMS |
| **Server Backend (Laravel)** | [http://127.0.0.1:8090/](http://127.0.0.1:8090/) | Otomatis dialihkan ke Halaman Login CMS |
| **API Health / Stats** | [http://127.0.0.1:8090/api/stats](http://127.0.0.1:8090/api/stats) | Tes status & hitungan database Laravel |
| **API CMS Admin** | `http://127.0.0.1:8090/api/cms/admin/*` | Endpoint manajemen (memerlukan Bearer Token) |
| **API CMS Public** | `http://127.0.0.1:8090/api/cms/public/*` | Endpoint konten publik (artikel, kajian, dll.) |

---

## 4. Kredensial CMS Admin (Development)

- **Username**: `app.talaqee.com`
- **Password**: `Jakarta1945@@`

> *(Kredensial ini dikonfigurasi di file `backend/.env` dan `.env` root)*

---

## 5. Perintah Operasional Sehari-hari (Commands)

Pastikan Anda membuka 2 terminal/tab PowerShell di root folder proyek:

### Terminal 1: Jalankan Backend Laravel
```powershell
npm run api:laravel
```
*(Menjalankan `php artisan serve --port=8090` di folder `backend/`)*

### Terminal 2: Jalankan Frontend Vite
```powershell
npm run dev
```
*(Menjalankan server pengembangan Vite di port `5173`)*

### Perintah Berguna Lainnya:
- **Migrasi Database**: `cd backend; php artisan migrate`
- **Build Produksi**: `npm run build`
