# API Inventory Web

Base URL: `/api`

Semua endpoint (kecuali `/api/login`) memerlukan header `Authorization: Bearer <token>`.

| URL | Method | Keterangan |
| --- | --- | --- |
| `/api/login` | POST | Autentikasi user, mengembalikan JWT token. Tidak butuh token (public). |
| `/api/generate-report` | POST | Generate laporan bulanan barang masuk (PDF/XLSX) berdasarkan `range_date` atau `start_date`/`end_date`. Akses: ADMIN & VIEWER. |
| `/api/product` | GET | Daftar barang dengan pagination, filter (search, kategori, lokasi, asal, keadaan, satuan, harga, range tanggal), dan sorting. Akses: ADMIN & VIEWER. |
| `/api/product/{id}` | GET | Detail satu barang berdasarkan id. Akses: ADMIN & VIEWER. |
| `/api/add-product` | POST | Tambah barang baru (multipart/form-data, foto opsional). Akses: ADMIN. |
| `/api/update-product/{idbarang}` | PATCH | Update data barang berdasarkan id. Akses: ADMIN. |
| `/api/delete-product/{idbarang}` | DELETE | Hapus barang berdasarkan id. Akses: ADMIN. |
| `/api/user` | GET | Daftar user dengan pagination, bisa difilter dengan query `role`. Akses: ADMIN. |
| `/api/add-user` | POST | Tambah user baru. Akses: ADMIN. |
| `/api/update-user/{iduser}` | PATCH | Update data user berdasarkan id. Akses: ADMIN. |
| `/api/delete-user/{iduser}` | DELETE | Hapus user berdasarkan id. Akses: ADMIN. |
| `/api/kategori-barang` | GET | Daftar kategori barang. Akses: ADMIN & VIEWER. |
| `/api/add-kategori-barang` | POST | Tambah kategori barang. Akses: ADMIN. |
| `/api/update-kategori-barang/{id}` | PATCH | Update kategori barang berdasarkan id. Akses: ADMIN. |
| `/api/delete-kategori-barang/{id}` | DELETE | Hapus kategori barang berdasarkan id. Akses: ADMIN. |
| `/api/lokasi-barang` | GET | Daftar lokasi barang. Akses: ADMIN & VIEWER. |
| `/api/add-lokasi-barang` | POST | Tambah lokasi barang. Akses: ADMIN. |
| `/api/update-lokasi-barang/{id}` | PATCH | Update lokasi barang berdasarkan id. Akses: ADMIN. |
| `/api/delete-lokasi-barang/{id}` | DELETE | Hapus lokasi barang berdasarkan id. Akses: ADMIN. |
| `/api/asal-barang` | GET | Daftar asal barang. Akses: ADMIN & VIEWER. |
| `/api/add-asal-barang` | POST | Tambah asal barang. Akses: ADMIN. |
| `/api/update-asal-barang/{id}` | PATCH | Update asal barang berdasarkan id. Akses: ADMIN. |
| `/api/delete-asal-barang/{id}` | DELETE | Hapus asal barang berdasarkan id. Akses: ADMIN. |
| `/api/keadaan-barang` | GET | Daftar keadaan barang. Akses: ADMIN & VIEWER. |
| `/api/add-keadaan-barang` | POST | Tambah keadaan barang. Akses: ADMIN. |
| `/api/update-keadaan-barang/{id}` | PATCH | Update keadaan barang berdasarkan id. Akses: ADMIN. |
| `/api/delete-keadaan-barang/{id}` | DELETE | Hapus keadaan barang berdasarkan id. Akses: ADMIN. |
| `/api/satuan-barang` | GET | Daftar satuan barang. Akses: ADMIN & VIEWER. |
| `/api/add-satuan-barang` | POST | Tambah satuan barang. Akses: ADMIN. |
| `/api/update-satuan-barang/{id}` | PATCH | Update satuan barang berdasarkan id. Akses: ADMIN. |
| `/api/delete-satuan-barang/{id}` | DELETE | Hapus satuan barang berdasarkan id. Akses: ADMIN. |

## Response Code

| Status Code | Keterangan |
| --- | --- |
| 200 | OK — request berhasil, response berisi data (JSON atau file untuk generate-report). |
| 400 | Bad Request — body/parameter tidak valid, field wajib kosong, tipe data salah, atau nilai duplikat. |
| 401 | Unauthorized — token tidak ada/tidak valid, atau username/password salah saat login. |
| 403 | Forbidden — token valid tetapi role tidak diizinkan (endpoint hanya untuk ADMIN). |
| 404 | Not Found — data yang diminta berdasarkan id tidak ditemukan. |
| 500 | Internal Server Error — kegagalan di sisi server, misalnya saat generate report gagal. |
