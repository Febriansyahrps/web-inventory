// lib/backup.ts — shared configuration and helpers for the CSV/ZIP backup API.
// Keeps the export and import routes in sync on file names, column order and
// import ordering.
import type { ArchiverError } from "archiver";
import { ZipArchive } from "archiver";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import type { Barang } from "@prisma/client";

/** Lookup tables in import order (barang is imported after all of these). */
export const LOOKUP_TABLES = [
  { file: "kategori_barang.csv", key: "kategori_barang" },
  { file: "keadaan_barang.csv", key: "keadaan_barang" },
  { file: "asal_barang.csv", key: "asal_barang" },
  { file: "satuan_barang.csv", key: "satuan_barang" },
  { file: "lokasi_barang.csv", key: "lokasi_barang" },
] as const;

export type LookupKey = (typeof LOOKUP_TABLES)[number]["key"];

export const BARANG_FILE = "barang.csv";

export const LOOKUP_COLUMNS = ["id", "name"] as const;

// Column order for barang.csv. id_user is intentionally excluded.
export const BARANG_COLUMNS = [
  "id",
  "id_kategori_barang",
  "id_lokasi_barang",
  "id_asal_barang",
  "id_keadaan_barang",
  "id_satuan_barang",
  "kode_barang",
  "no_register",
  "nama_barang",
  "merk_barang",
  "no_sertifikat",
  "bahan",
  "tahun_perolehan",
  "ukuran_barang",
  "jumlah_barang",
  "harga_barang",
  "foto_barang",
  "created_at",
  "updated_at",
] as const;

/** Every file a valid backup ZIP must contain. */
export const REQUIRED_FILES: string[] = [
  ...LOOKUP_TABLES.map((table) => table.file),
  BARANG_FILE,
];

/** Serialize rows to CSV text with an explicit, stable column order. */
export function toCsv(
  columns: readonly string[],
  rows: Record<string, string>[],
): string {
  return stringify(rows, { header: true, columns: [...columns] });
}

/** Parse CSV text into a header list plus row objects keyed by column name. */
export function parseCsv(text: string): {
  header: string[];
  rows: Record<string, string>[];
} {
  let header: string[] = [];
  const rows = parse(text, {
    bom: true,
    columns: (record: string[]) => {
      header = record;
      return record;
    },
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  return { header, rows };
}

/** Map a Barang row to its CSV representation (nulls become empty cells). */
export function barangToCsvRow(row: Barang): Record<string, string> {
  const value = (input: string | number | null): string =>
    input === null ? "" : String(input);

  return {
    id: value(row.id),
    id_kategori_barang: value(row.idKategoriBarang),
    id_lokasi_barang: value(row.idLokasiBarang),
    id_asal_barang: value(row.idAsalBarang),
    id_keadaan_barang: value(row.idKeadaanBarang),
    id_satuan_barang: value(row.idSatuanBarang),
    kode_barang: value(row.kodeBarang),
    no_register: value(row.noRegister),
    nama_barang: row.namaBarang,
    merk_barang: value(row.merkBarang),
    no_sertifikat: value(row.noSertifikat),
    bahan: value(row.bahan),
    tahun_perolehan: value(row.tahunPerolehan),
    ukuran_barang: value(row.ukuranBarang),
    jumlah_barang: value(row.jumlahBarang),
    harga_barang: value(row.hargaBarang?.toString() ?? null),
    foto_barang: value(row.fotoBarang),
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

/** Build an in-memory ZIP archive from named text entries. */
export function buildZip(
  files: { name: string; content: string }[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("warning", (error: ArchiverError) => {
      if (error.code !== "ENOENT") reject(error);
    });
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));

    for (const file of files) {
      archive.append(file.content, { name: file.name });
    }

    archive.finalize().catch(reject);
  });
}
