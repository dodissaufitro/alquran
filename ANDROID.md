# Build Android — Faithful Path

Aplikasi web (Vite + React) dibungkus dengan [Capacitor](https://capacitorjs.com/) menjadi APK Android.

## Persyaratan

- **Node.js** 20+
- **Android Studio** (termasuk Android SDK)
- **Java JDK** 17+ (biasanya sudah ada dengan Android Studio)

Set `sdk.dir` di `android/local.properties` (lihat `local.properties.example`).

## Perintah

```bash
# Sinkronkan web build ke proyek Android
npm run cap:sync

# Buka di Android Studio (untuk emulator / edit native)
npm run cap:open

# Build APK debug (untuk testing)
npm run android:build
```

APK debug hasil build:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Install di HP

1. Aktifkan **Instal dari sumber tidak dikenal** di pengaturan Android
2. Salin `app-debug.apk` ke HP
3. Buka file APK dan instal

Atau sambungkan HP via USB, lalu di Android Studio: **Run** (▶).

## APK Release (sudah dikonfigurasi)

Keystore: `android/faithfulpath-release.keystore`  
Konfigurasi: `android/keystore.properties` (tidak di-commit ke git)

```bash
npm run android:release
```

**APK release:**

```
android/app/build/outputs/apk/release/app-release.apk
```

**Penting:** Simpan keystore dan password dengan aman. Tanpa file yang sama, Anda tidak bisa memperbarui aplikasi di Play Store.

Untuk Play Store, gunakan AAB:

```bash
cd android
.\gradlew.bat bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

Ganti password default di `keystore.properties` sebelum publikasi resmi.

## Login Google di APK (tetap di app — tanpa browser eksternal)

1. **Widget Google** di WebView (`https://localhost`) — sama seperti web, pilih akun → langsung login.
2. **Native Google Sign-In** — picker akun sistem Android → kembali ke app.

Daftarkan di Google Console → OAuth **Web client** → **Authorized JavaScript origins**:
`https://localhost` (untuk widget di APK)

Native sign-in membutuhkan **OAuth Android client** terpisah:

### Langkah di Google Console

1. **Credentials** → **Create credentials** → **OAuth client ID**
2. Application type: **Android**
3. Isi:

| Field | Nilai |
|-------|--------|
| Package name | `com.faithfulpath.alquran` |
| SHA-1 debug (APK `android:build`) | `D1:48:8C:60:F4:D1:17:93:57:7C:95:26:3E:7F:02:50:8C:B6:70:99` |
| SHA-1 release (APK `android:release`) | `62:AA:EB:24:DD:52:80:7A:C7:F8:FA:56:6A:D9:64:71:15:62:98:A4` |

Anda bisa menambahkan **kedua SHA-1** ke satu client Android, atau buat client terpisah untuk debug dan release.

4. **Save** → tunggu **2–5 menit** → coba login lagi di HP.

`VITE_GOOGLE_CLIENT_ID` = **Web client ID** (jangan diganti dengan Android client ID).

OAuth consent screen: tambah email tester atau publish app.

Cek SHA-1 kapan saja: `npm run android:sha1`

## Pembayaran coin / Xendit di APK

1. Build memakai `.env.production` — `VITE_COINS_API_BASE` dan `VITE_SUBSCRIPTION_API_BASE` mengarah ke `https://app.talaqee.com`.
2. Checkout mengirim `clientPlatform: android` → redirect Xendit ke `https://app.talaqee.com/payment-return.html?fp_payment=success&orderId=...`.
3. Halaman bridge membuka deep link `com.faithfulpath.alquran://payment` → app menutup browser dan memverifikasi pesanan.
4. Di hosting (`api/subscription/config.local.php`):

```php
putenv('SUBSCRIPTION_APP_ORIGIN=https://app.talaqee.com');
putenv('SUBSCRIPTION_APK_RETURN_URL=https://app.talaqee.com/payment-return.html');
putenv('XENDIT_SECRET_KEY=xnd_...');
```

5. Pastikan `payment-return.html` ter-deploy (dari folder `public/`, ikut `npm run build` → `dist/payment-return.html`).
6. Mode QRIS demo: tetap di layar app; Xendit dibuka di browser sistem (fullscreen).

## Setelah ubah kode React

Selalu jalankan ulang sebelum build APK:

```bash
npm run cap:sync
```

Lalu build Gradle atau Run dari Android Studio.
