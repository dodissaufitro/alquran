# Cara Menjalankan Server (Singkat)

Buka 2 terminal / tab PowerShell di editor kode Anda dari root folder proyek:

### 1. Terminal 1 — Backend API (Laravel)
```powershell
npm run api:laravel
```
* **URL**: `http://127.0.0.1:8090`
* **Tes API**: `http://127.0.0.1:8090/api/stats`

### 2. Terminal 2 — Frontend App (React / Vite)
```powershell
npm run dev
```
* **URL App**: `http://localhost:5173/`
* *(Otomatis terhubung ke backend Laravel di atas)*
