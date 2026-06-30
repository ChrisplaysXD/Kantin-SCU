# Canteen UI (Frontend)

Antarmuka interaktif bergaya *glassmorphism* untuk aplikasi diet kantin pintar. Dibangun menggunakan React (Vite) dan TypeScript.

## Struktur Folder & File
- `src/App.tsx`: Komponen utama (nyawa) *frontend*. Mengatur logika interaksi, *state* profil pengguna, *log* riwayat makan persisten, peringatan surplus kalori, dan panel *Database Admin*.
- `src/App.css` & `src/index.css`: Penata gaya (CSS) utama. Menampung semua desain *glassmorphism*, animasi *hover*, gradien warna dinamis, dan tata letak *responsive* aplikasi.
- `src/main.tsx`: Titik awal berjalannya aplikasi React yang menyuntikkan komponen `App.tsx` ke dalam DOM HTML utama.
- `index.html`: File kerangka dasar HTML tempat seluruh skrip *frontend* dipasang.
- `package.json`: Daftar identitas proyek dan semua dependensi pustaka JavaScript yang terinstal.
- `vite.config.ts`: Konfigurasi *bundler* Vite untuk mempercepat proses kompilasi kode *frontend* saat masa *development*.

## Cara Menjalankan
1. Instal dependensi: `npm install`
2. Jalankan peladen pengembangan: `npm run dev` (otomatis jalan di port 5173).
