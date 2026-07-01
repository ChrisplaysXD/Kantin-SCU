# Canteen Engine (Backend)

Sistem backend bertenaga AI untuk aplikasi diet kantin mahasiswa. Dibangun menggunakan FastAPI dan PostgreSQL.

## Struktur Folder & File
- `api.py`: Jantung utama aplikasi. Menampung semua *endpoint* HTTP (seperti `/eat`, `/canteens`, `/reset`) yang mengatur lalu lintas data antara *frontend* dan *database*.
- `main.py`: Skrip inisialisasi awal. Bertugas mereset isi *database* dan menyuntikkan (seeding) puluhan data daftar makanan fiktif saat peladen pertama kali dinyalakan.
- `db/models.py`: Berisi cetak biru (schema) rancangan tabel *database* PostgreSQL menggunakan SQLAlchemy (seperti tabel `MenuItem` dan `OrderRecord`).
- `modules/recommender.py`: Otak algoritma yang bertugas menghitung sisa kalori pengguna dan merekomendasikan makanan alternatif yang lebih sehat.
- `modules/enrichment.py`: Modul kecerdasan buatan (AI) yang secara otomatis menebak kalori dan nutrisi saat *user* memasukkan nama makanan baru yang tidak dikenali *database*.
- `compose.yaml`: File konfigurasi Docker untuk menjalankan mesin PostgreSQL (`canteen-pg`) secara terisolasi.

## Cara Menjalankan
1. Nyalakan Docker: `docker-compose up -d`
2. Jalankan peladen FastAPI: `uvicorn api:app --reload --port 8080`
