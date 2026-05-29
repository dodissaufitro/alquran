# Panduan cepat — perbaiki login Google di APK

## Langkah 1 (paling penting — cukup ini untuk login di app)

Buka [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)

Pilih **OAuth 2.0 Client ID** tipe **Web application** (Client ID yang sama dengan `VITE_GOOGLE_CLIENT_ID`).

Di **Authorized JavaScript origins**, tambahkan:

```
https://localhost
```

Klik **Save**. Tunggu **2–5 menit**, lalu coba login lagi di APK.

APK Capacitor memakai origin `https://localhost` di WebView — tanpa origin ini widget Google tidak jalan.

---

## Langkah 2 (opsional — native picker akun Android)

Hanya jika ingin native Google Sign-In (picker sistem). Buat client **Android** terpisah:

| Field | Nilai |
|-------|--------|
| Package name | `com.faithfulpath.alquran` |
| SHA-1 debug | `D1:48:8C:60:F4:D1:17:93:57:7C:95:26:3E:7F:02:50:8C:B6:70:99` |
| SHA-1 release | `62:AA:EB:24:DD:52:80:7A:C7:F8:FA:56:6A:D9:64:71:15:62:98:A4` |

Cek SHA-1: `npm run android:sha1`

---

## OAuth consent screen

Pastikan email Google Anda ada di **Test users** jika app masih mode Testing.
