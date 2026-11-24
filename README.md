# DDM Music

DDM Music adalah pemutar audio web dan aplikasi Android berbasis Capacitor. Aplikasi dapat memutar file audio yang dipilih dari perangkat.

## Unduh APK dari GitHub

1. Buka tab **Actions** di repositori GitHub dan pilih workflow **Build Android APK**.
2. Buka build terbaru yang berhasil.
3. Unduh artifact **ddm-music-android**, lalu ekstrak `app-debug.apk`.
4. Buka APK di perangkat Android. Jika diminta, izinkan pemasangan aplikasi dari sumber ini.

Unduhan terbaru tersedia di [GitHub Releases](https://github.com/muhammadrashaqa21-cmd/ddm-music-player/releases/latest/download/ddm-music.apk). Untuk menerbitkan versi baru, buat dan push tag versi, misalnya `v1.0.1`. Workflow akan membangun APK dan melampirkannya sebagai `ddm-music.apk`.

## Build lokal

Butuh Node.js 22 dan Java 21.

```sh
npm install
npm run android:add
```

Di Windows, jalankan `cd android` lalu `.\gradlew.bat assembleDebug`. Di Linux/macOS, jalankan `cd android` lalu `./gradlew assembleDebug`.

APK hasil build berada di `android/app/build/outputs/apk/debug/app-debug.apk`.
