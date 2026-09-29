// lib/reportModel.ts — single source of truth for the monthly arrival report.
//
// Shared by the PDF and XLSX renderers so both always emit the same title,
// the same 17 columns, and the same row values. Only presentation differs:
// the PDF renders display strings, the XLSX writes the raw values (real dates
// and numbers) with a number format.

import type { ReportBarang } from "@/lib/reportData";

export const REPORT_TITLE = "LAPORAN BULANAN INVENTARIS BARANG MASUK";
export const REPORT_SUBTITLE = "SMK TAMANSISWA BANJARNEGARA";

export const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const NUMBER_ID = new Intl.NumberFormat("id-ID");

export type CellValue = string | number | Date | null;

export interface ReportColumn {
  title: string;
  /** Relative width, scaled per medium (PDF points / Excel character units). */
  weight: number;
  align?: "left" | "center" | "right";
  /** The underlying value for a row. */
  raw: (row: ReportBarang, index: number) => CellValue;
  /** Excel number format, when the raw value is a real date/number. */
  numFmt?: string;
  /** How the value reads in the PDF; defaults to `cellText`. */
  display?: (value: CellValue) => string;
}

/** Nullish cells render as "-", matching the product table's convention. */
export const cellText = (value: CellValue): string => {
  if (value === null || value === undefined || value === "") return "-";
  return value instanceof Date ? String(value) : String(value);
};

/** Tanggal column: date only, `DD-MM-YYYY`. */
export const formatShortDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
};

/** Signature block date: report generation date as `D Month YYYY`. */
export const formatLongDate = (date: Date): string =>
  `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;

const currency = (value: CellValue): string =>
  `Rp ${NUMBER_ID.format(Number(value) || 0)}`;

// Flat single-row header — 17 columns per the report spec.
export const REPORT_COLUMNS: ReportColumn[] = [
  {
    title: "No",
    weight: 0.5,
    align: "center",
    raw: (_row, index) => index + 1,
  },
  {
    title: "Tanggal",
    weight: 1.0,
    align: "center",
    raw: (row) => row.createdAt,
    numFmt: "DD-MM-YYYY",
    display: (value) => formatShortDate(value as Date),
  },
  { title: "Kode Barang", weight: 1.1, raw: (row) => row.kodeBarang },
  { title: "No. Register", weight: 1.08, raw: (row) => row.noRegister },
  { title: "No. Sertifikat", weight: 1.08, raw: (row) => row.noSertifikat },
  { title: "Nama Barang", weight: 1.76, raw: (row) => row.namaBarang },
  { title: "Kategori", weight: 1.0, raw: (row) => row.kategoriBarang?.name ?? null },
  { title: "Merk", weight: 0.9, raw: (row) => row.merkBarang },
  { title: "Asal", weight: 0.9, raw: (row) => row.asalBarang?.name ?? null },
  { title: "Keadaan", weight: 0.9, raw: (row) => row.keadaanBarang?.name ?? null },
  { title: "Bahan", weight: 0.9, raw: (row) => row.bahan },
  { title: "Satuan", weight: 0.72, raw: (row) => row.satuanBarang?.name ?? null },
  { title: "Lokasi", weight: 1.0, raw: (row) => row.lokasiBarang?.name ?? null },
  { title: "Ukuran", weight: 0.84, raw: (row) => row.ukuranBarang },
  {
    title: "Tahun",
    weight: 0.6,
    align: "center",
    raw: (row) => row.tahunPerolehan,
    numFmt: "0",
  },
  {
    title: "Jumlah",
    weight: 0.66,
    align: "center",
    raw: (row) => row.jumlahBarang,
    numFmt: "#,##0",
  },
  {
    title: "Harga",
    weight: 1.36,
    align: "right",
    raw: (row) => row.hargaBarang.toNumber(),
    numFmt: "#,##0",
    display: currency,
  },
];

export const REPORT_HEADERS = REPORT_COLUMNS.map((column) => column.title);

export const REPORT_TOTAL_WEIGHT = REPORT_COLUMNS.reduce(
  (sum, column) => sum + column.weight,
  0,
);

/** Raw values for a row, for spreadsheets that should hold real dates/numbers. */
export const reportRowValues = (row: ReportBarang, index: number): CellValue[] =>
  REPORT_COLUMNS.map((column) => column.raw(row, index));

/** Display strings for a row, for the fixed-width PDF table. */
export const reportRowDisplay = (row: ReportBarang, index: number): string[] =>
  REPORT_COLUMNS.map((column) =>
    (column.display ?? cellText)(column.raw(row, index)),
  );
