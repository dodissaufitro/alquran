# Panduan Deployment / Hosting Aplikasi Al-Quran

Aplikasi ini terdiri dari dua bagian: Frontend (React/TypeScript) dan Backend (Laravel). Berikut adalah panduan langkah demi langkah untuk melakukan hosting (terutama pada Shared Hosting / cPanel).

## 1. Persiapan Backend (Laravel)

1. **Upload File**: Upload seluruh isi folder `backend` ke server. 
   - *Praktik Terbaik*: Di cPanel, letakkan folder `backend` di luar `public_html` (misalnya di `/home/username/backend`) demi keamanan.
2. **Setup Subdomain / Document Root**: 
   - Jika frontend dan backend dipisah domainnya, buat subdomain untuk API (misal: `api.domainanda.com`).
   - Arahkan Document Root dari subdomain tersebut ke folder `public` di dalam folder backend (contoh: `/home/username/backend/public`).
3. **Database**: 
   - Buat database MySQL baru beserta usernya di panel hosting.
4. **Konfigurasi `.env`**:
   - Di server, edit atau buat file `.env` (berdasarkan `.env.example`).
   - Ubah konfigurasi menjadi production:
     ```env
     APP_ENV=production
     APP_DEBUG=false
     APP_URL=https://api.domainanda.com
     
     DB_DATABASE=nama_database_baru
     DB_USERNAME=user_database_baru
     DB_PASSWORD=password_database_baru
     ```
5. **Install Dependencies & Setup**: 
   - Jika hosting Anda memiliki fitur Terminal/SSH, masuk ke folder backend dan jalankan:
     ```bash
     composer install --optimize-autoloader --no-dev
     php artisan key:generate
     php artisan migrate --force
     php artisan storage:link
     php artisan config:cache
     php artisan route:cache
     php artisan view:cache
     ```
   - *Catatan*: Jika tidak ada SSH, Anda bisa mengupload folder `vendor` dari lokal (setelah menjalankan composer install) dan mengekspor-impor database SQL via phpMyAdmin.
6. **Hak Akses (Permissions)**: 
   - Pastikan folder `storage` dan `bootstrap/cache` memiliki permission `775` (atau `777` tergantung konfigurasi server) agar framework dapat menulis file cache dan log.

## 2. Persiapan Frontend (React/TypeScript)

1. **Sesuaikan URL API**: 
   - Di lokal Anda, pastikan frontend menunjuk ke URL API production yang baru saja dibuat. Biasanya diatur pada file `.env` di folder root frontend:
     ```env
     VITE_API_BASE_URL=https://api.domainanda.com
     ```
2. **Build Frontend**: 
   - Buka terminal di folder root project frontend Anda.
   - Jalankan perintah build:
     ```bash
     npm run build
     ```
   - Proses ini akan menghasilkan folder `dist` (atau `build`) yang berisi file statis siap produksi.
3. **Upload ke Hosting**:
   - Upload **seluruh isi** dari folder `dist` tersebut ke folder `public_html` (atau folder Document Root dari domain utama Anda).
4. **Konfigurasi Routing (Penting untuk SPA)**:
   - Karena frontend menggunakan React (Single Page Application), routing ditangani oleh browser. Jika user mereload halaman selain halaman utama, server akan merespon dengan `404 Not Found`.
   - Untuk mengatasinya di server Apache, buat file `.htaccess` di dalam `public_html` dan isikan kode berikut:
     ```apache
     <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
     </IfModule>
     ```

## 3. Pengecekan Terakhir
- Buka domain utama Anda di browser.
- Coba lakukan interaksi yang membutuhkan database (misal: login, register, atau memuat data).
- Buka `Developer Tools (F12) -> Tab Network & Console` di browser untuk memastikan tidak ada error CORS atau error koneksi API.
