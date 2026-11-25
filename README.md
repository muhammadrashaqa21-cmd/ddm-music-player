# DDM Music

DDM Music adalah pemutar audio web dan aplikasi Android berbasis Capacitor. Pada Android, audio diputar melalui pemutar native agar tetap berjalan di latar dan muncul sebagai kontrol media di notifikasi/layar kunci. Saat musik berjalan di latar, kapsul mini berada di tengah bagian atas layar; ketuk kapsul untuk kembali ke aplikasi. Pemakaian pertama meminta izin **Tampil di atas aplikasi lain**. Kapsul disembunyikan saat aplikasi dibuka kembali atau musik dijeda/dihentikan. Aplikasi Android membuka layar dalam mode imersif; usap dari tepi atas atau bawah untuk menampilkan sementara bar sistem. Panel notifikasi tetap bisa dibuka. Di dalam aplikasi, kapsul pemutar mengembang saat disentuh dan tetap mengikuti gaya Android.

## Setelan aplikasi

Mode equalizer, nilai 10 band manual, volume, acak, dan ulangi disimpan otomatis di perangkat dan dapat disimpan langsung lewat tombol **Simpan setelan**. Setelan tidak disinkronkan antarperangkat. Equalizer audio saat ini tersedia di versi web; pemutar native Android belum menyediakan pemrosesan equalizer.

## Unduh APK dari GitHub

1. Buka tab **Actions** di repositori GitHub dan pilih workflow **Build Android APK**.
2. Buka build terbaru yang berhasil.
3. Unduh artifact **ddm-music-android**, lalu ekstrak `app-debug.apk`.
4. Buka APK di perangkat Android. Jika diminta, izinkan pemasangan aplikasi dari sumber ini.
5. Putar musik dan izinkan DDM Music **Tampil di atas aplikasi lain** agar kapsul mini muncul saat aplikasi berada di latar.

Unduhan terbaru tersedia di [GitHub Releases](https://github.com/muhammadrashaqa21-cmd/ddm-music-player/releases/latest/download/ddm-music.apk). Untuk menerbitkan versi baru, buat dan push tag versi berikutnya. Workflow akan membangun APK dan melampirkannya sebagai `ddm-music.apk`.

Rilis GitHub terbaru yang sudah berhasil adalah **v1.0.2**. Untuk rilis berikutnya, setelah perubahan dikirim ke branch utama, naikkan tag ke versi baru dan push tag tersebut. Workflow **Build Android APK** akan membuat rilis secara otomatis; jangan gunakan kembali tag yang sudah ada.

## Build lokal

Butuh Node.js 22 dan Java 21.

```sh
npm install
npm run android:add
```

Untuk proyek Android yang sudah ada, jalankan `npm run android:sync`. Perintah tersebut menyiapkan izin pemutaran media latar, overlay, service, dan plugin kapsul. Setelah itu, di Windows jalankan `cd android` lalu `.\gradlew.bat assembleDebug`. Di Linux/macOS, jalankan `cd android` lalu `./gradlew assembleDebug`.

APK hasil build berada di `android/app/build/outputs/apk/debug/app-debug.apk`.
