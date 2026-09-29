// lib/serialize.ts — map a Prisma Barang row (with expanded relations)
// to the API JSON shape shared by /api/product and /api/product/:id.
import type { Barang, KategoriBarang, LokasiBarang, AsalBarang, KeadaanBarang, SatuanBarang } from "@prisma/client";

type BarangWithRelations = Barang & {
  kategoriBarang: KategoriBarang | null;
  lokasiBarang: LokasiBarang | null;
  asalBarang: AsalBarang | null;
  keadaanBarang: KeadaanBarang | null;
  satuanBarang: SatuanBarang | null;
};

export function serializeBarang(row: BarangWithRelations) {
  return {
    id: row.id,
    kode_barang: row.kodeBarang,
    no_register: row.noRegister,
    nama_barang: row.namaBarang,
    merk_barang: row.merkBarang,
    no_sertifikat: row.noSertifikat,
    bahan: row.bahan,
    tahun_perolehan: row.tahunPerolehan,
    ukuran_barang: row.ukuranBarang,
    jumlah_barang: row.jumlahBarang,
    harga_barang: row.hargaBarang.toNumber(),
    foto_barang: row.fotoBarang,
    kategori_barang: row.kategoriBarang
      ? { id: row.kategoriBarang.id, name: row.kategoriBarang.name }
      : null,
    lokasi_barang: row.lokasiBarang
      ? { id: row.lokasiBarang.id, name: row.lokasiBarang.name }
      : null,
    asal_barang: row.asalBarang
      ? { id: row.asalBarang.id, name: row.asalBarang.name }
      : null,
    keadaan_barang: row.keadaanBarang
      ? { id: row.keadaanBarang.id, name: row.keadaanBarang.name }
      : null,
    satuan_barang: row.satuanBarang
      ? { id: row.satuanBarang.id, name: row.satuanBarang.name }
      : null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export const barangInclude = {
  kategoriBarang: true,
  lokasiBarang: true,
  asalBarang: true,
  keadaanBarang: true,
  satuanBarang: true,
} as const;
