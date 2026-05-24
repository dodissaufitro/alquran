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

## Setelah ubah kode React

Selalu jalankan ulang sebelum build APK:

```bash
npm run cap:sync
```

Lalu build Gradle atau Run dari Android Studio.
