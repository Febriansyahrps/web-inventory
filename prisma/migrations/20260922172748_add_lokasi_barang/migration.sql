-- AlterTable
ALTER TABLE "barang" ADD COLUMN     "id_lokasi_barang" INTEGER;

-- CreateTable
CREATE TABLE "lokasi_barang" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "lokasi_barang_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_lokasi_barang_fkey" FOREIGN KEY ("id_lokasi_barang") REFERENCES "lokasi_barang"("id") ON DELETE SET NULL ON UPDATE CASCADE;
