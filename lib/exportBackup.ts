// lib/exportBackup.ts — builds the inventory backup ZIP (one CSV per table).
// Shared by /api/export-backup and /api/send-backup-email so both produce the
// exact same archive from a single source of truth.
import { prisma } from "@/lib/prisma";
import {
  BARANG_COLUMNS,
  BARANG_FILE,
  LOOKUP_COLUMNS,
  LOOKUP_TABLES,
  barangToCsvRow,
  buildZip,
  toCsv,
  type LookupKey,
} from "@/lib/backup";
import { backupFilename } from "@/src/utils/backupFilename";

export async function generateBackupZip(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const [kategori, keadaan, asal, satuan, lokasi, barang] = await Promise.all([
    prisma.kategoriBarang.findMany({ orderBy: { id: "asc" } }),
    prisma.keadaanBarang.findMany({ orderBy: { id: "asc" } }),
    prisma.asalBarang.findMany({ orderBy: { id: "asc" } }),
    prisma.satuanBarang.findMany({ orderBy: { id: "asc" } }),
    prisma.lokasiBarang.findMany({ orderBy: { id: "asc" } }),
    // id_user is intentionally excluded from the backup.
    prisma.barang.findMany({ orderBy: { id: "asc" } }),
  ]);

  const lookupRows: Record<LookupKey, { id: number; name: string }[]> = {
    kategori_barang: kategori,
    keadaan_barang: keadaan,
    asal_barang: asal,
    satuan_barang: satuan,
    lokasi_barang: lokasi,
  };

  const files = [
    ...LOOKUP_TABLES.map(({ file, key }) => ({
      name: file,
      content: toCsv(
        LOOKUP_COLUMNS,
        lookupRows[key].map((row) => ({
          id: String(row.id),
          name: row.name,
        })),
      ),
    })),
    {
      name: BARANG_FILE,
      content: toCsv(BARANG_COLUMNS, barang.map(barangToCsvRow)),
    },
  ];

  return { buffer: await buildZip(files), filename: backupFilename() };
}
