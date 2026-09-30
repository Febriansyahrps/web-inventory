-- Make the barang scalar fields optional: only nama_barang stays required.

ALTER TABLE "barang" ALTER COLUMN "kode_barang" DROP NOT NULL;
ALTER TABLE "barang" ALTER COLUMN "no_register" DROP NOT NULL;
ALTER TABLE "barang" ALTER COLUMN "jumlah_barang" DROP NOT NULL;
ALTER TABLE "barang" ALTER COLUMN "harga_barang" DROP NOT NULL;
