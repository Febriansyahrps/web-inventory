/*
  Warnings:

  - You are about to drop the column `keadaan_barang` on the `barang` table. All the data in the column will be lost.
  - You are about to drop the column `satuan` on the `barang` table. All the data in the column will be lost.
  - Added the required column `id_keadaan_barang` to the `barang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_satuan_barang` to the `barang` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "barang" DROP COLUMN "keadaan_barang",
DROP COLUMN "satuan",
ADD COLUMN     "id_keadaan_barang" INTEGER NOT NULL,
ADD COLUMN     "id_satuan_barang" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "keadaan_barang" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "keadaan_barang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "satuan_barang" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "satuan_barang_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_keadaan_barang_fkey" FOREIGN KEY ("id_keadaan_barang") REFERENCES "keadaan_barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_satuan_barang_fkey" FOREIGN KEY ("id_satuan_barang") REFERENCES "satuan_barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
