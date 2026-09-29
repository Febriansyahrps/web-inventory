/*
  Warnings:

  - You are about to drop the column `asal_barang` on the `barang` table. All the data in the column will be lost.
  - Added the required column `id_asal_barang` to the `barang` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "barang" DROP COLUMN "asal_barang",
ADD COLUMN     "id_asal_barang" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "asal_barang" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "asal_barang_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_asal_barang_fkey" FOREIGN KEY ("id_asal_barang") REFERENCES "asal_barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
