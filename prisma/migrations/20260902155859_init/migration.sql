-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "id_role" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategory_barang" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "kategory_barang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barang" (
    "id" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "id_kategori_barang" INTEGER NOT NULL,
    "kode_barang" TEXT NOT NULL,
    "no_register" TEXT NOT NULL,
    "nama_barang" TEXT NOT NULL,
    "merk_barang" TEXT,
    "no_sertifikat" TEXT,
    "bahan" TEXT,
    "asal_barang" TEXT,
    "tahun_perolehan" INTEGER,
    "ukuran_barang" TEXT,
    "satuan" TEXT,
    "keadaan_barang" TEXT,
    "jumlah_barang" INTEGER NOT NULL,
    "harga_barang" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_id_kategori_barang_fkey" FOREIGN KEY ("id_kategori_barang") REFERENCES "kategory_barang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
