-- DropForeignKey
ALTER TABLE "barang" DROP CONSTRAINT "barang_id_asal_barang_fkey";

-- DropForeignKey
ALTER TABLE "barang" DROP CONSTRAINT "barang_id_kategori_barang_fkey";

-- DropForeignKey
ALTER TABLE "barang" DROP CONSTRAINT "barang_id_keadaan_barang_fkey";

-- DropForeignKey
ALTER TABLE "barang" DROP CONSTRAINT "barang_id_satuan_barang_fkey";

-- DropForeignKey
ALTER TABLE "barang" DROP CONSTRAINT "barang_id_user_fkey";

-- AlterTable
ALTER TABLE "barang" ALTER COLUMN "id_user" DROP NOT NULL,
ALTER COLUMN "id_kategori_barang" DROP NOT NULL,
ALTER COLUMN "id_keadaan_barang" DROP NOT NULL,
ALTER COLUMN "id_satuan_barang" DROP NOT NULL,
ALTER COLUMN "id_asal_barang" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_kategori_barang_fkey" FOREIGN KEY ("id_kategori_barang") REFERENCES "kategory_barang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_asal_barang_fkey" FOREIGN KEY ("id_asal_barang") REFERENCES "asal_barang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_keadaan_barang_fkey" FOREIGN KEY ("id_keadaan_barang") REFERENCES "keadaan_barang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_satuan_barang_fkey" FOREIGN KEY ("id_satuan_barang") REFERENCES "satuan_barang"("id") ON DELETE SET NULL ON UPDATE CASCADE;
