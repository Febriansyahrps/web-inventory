import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { Open } from "unzipper";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import {
  BARANG_COLUMNS,
  BARANG_FILE,
  LOOKUP_COLUMNS,
  LOOKUP_TABLES,
  parseCsv,
  type LookupKey,
} from "@/lib/backup";

// The upsert transaction below is allowed 120s, so the function needs headroom
// beyond the platform default.
export const maxDuration = 300;

interface ImportError {
  file: string;
  row: number;
  reason: string;
}

type CsvRow = Record<string, string>;

// FK columns in barang.csv -> the lookup table they must resolve against.
const FK_COLUMNS: { column: string; key: LookupKey; label: string }[] = [
  { column: "id_kategori_barang", key: "kategori_barang", label: "kategori" },
  { column: "id_lokasi_barang", key: "lokasi_barang", label: "lokasi" },
  { column: "id_asal_barang", key: "asal_barang", label: "asal" },
  { column: "id_keadaan_barang", key: "keadaan_barang", label: "keadaan" },
  { column: "id_satuan_barang", key: "satuan_barang", label: "satuan" },
];

const cell = (row: CsvRow, column: string): string =>
  (row[column] ?? "").trim();

/** Parse a positive-integer cell, or null when it isn't one. */
const asPositiveInt = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

/** Optional integer cell: blank -> null, invalid -> undefined. */
const asOptionalInt = (value: string): number | null | undefined => {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
};

/**
 * Read a required CSV out of the extracted ZIP, checking it exists and has all
 * of `columns`. Any problem is recorded in `errors` and null is returned.
 */
const parseRequiredFile = (
  file: string,
  text: string | undefined,
  columns: readonly string[],
  errors: ImportError[],
): { header: string[]; rows: CsvRow[] } | null => {
  if (text === undefined) {
    errors.push({
      file,
      row: 0,
      reason: "File wajib tidak ada di dalam ZIP",
    });
    return null;
  }

  let parsed: { header: string[]; rows: CsvRow[] };
  try {
    parsed = parseCsv(text);
  } catch (error) {
    errors.push({
      file,
      row: 0,
      reason: `Gagal membaca CSV: ${(error as Error).message}`,
    });
    return null;
  }

  const missing = columns.filter((column) => !parsed.header.includes(column));
  if (missing.length > 0) {
    errors.push({
      file,
      row: 1,
      reason: `Kolom wajib belum ada: ${missing.join(", ")}`,
    });
    return null;
  }

  return parsed;
};

/** Build the scalar write payload for one barang.csv row. */
const barangWriteData = (row: CsvRow): Prisma.BarangUncheckedCreateInput => {
  const optionalString = (column: string): string | null => {
    const value = cell(row, column);
    return value === "" ? null : value;
  };

  const data: Prisma.BarangUncheckedCreateInput = {
    idKategoriBarang: asOptionalInt(cell(row, "id_kategori_barang")),
    idLokasiBarang: asOptionalInt(cell(row, "id_lokasi_barang")),
    idAsalBarang: asOptionalInt(cell(row, "id_asal_barang")),
    idKeadaanBarang: asOptionalInt(cell(row, "id_keadaan_barang")),
    idSatuanBarang: asOptionalInt(cell(row, "id_satuan_barang")),
    kodeBarang: optionalString("kode_barang"),
    noRegister: optionalString("no_register"),
    namaBarang: cell(row, "nama_barang"),
    merkBarang: optionalString("merk_barang"),
    noSertifikat: optionalString("no_sertifikat"),
    bahan: optionalString("bahan"),
    tahunPerolehan: asOptionalInt(cell(row, "tahun_perolehan")) ?? null,
    ukuranBarang: optionalString("ukuran_barang"),
    jumlahBarang: asOptionalInt(cell(row, "jumlah_barang")) ?? null,
    hargaBarang: optionalString("harga_barang"),
    fotoBarang: optionalString("foto_barang"),
  };

  const createdAt = cell(row, "created_at");
  if (createdAt !== "") data.createdAt = new Date(createdAt);
  const updatedAt = cell(row, "updated_at");
  if (updatedAt !== "") data.updatedAt = new Date(updatedAt);

  return data;
};

/** Upsert one lookup row through the matching Prisma delegate. */
const upsertLookup = (
  tx: Prisma.TransactionClient,
  key: LookupKey,
  id: number,
  name: string,
) => {
  const create = { id, name };
  const update = { name };
  switch (key) {
    case "kategori_barang":
      return tx.kategoriBarang.upsert({ where: { id }, update, create });
    case "keadaan_barang":
      return tx.keadaanBarang.upsert({ where: { id }, update, create });
    case "asal_barang":
      return tx.asalBarang.upsert({ where: { id }, update, create });
    case "satuan_barang":
      return tx.satuanBarang.upsert({ where: { id }, update, create });
    case "lokasi_barang":
      return tx.lokasiBarang.upsert({ where: { id }, update, create });
  }
};

export async function POST(req: Request) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { message: "Body multipart tidak valid" },
      { status: 400 },
    );
  }

  const upload = form.get("file");
  if (!(upload instanceof File)) {
    return NextResponse.json(
      { message: "File wajib belum diisi: file" },
      { status: 400 },
    );
  }

  // ---- Extract every CSV entry into memory before touching the database ----
  const entries = new Map<string, string>();
  try {
    const directory = await Open.buffer(
      Buffer.from(await upload.arrayBuffer()),
    );
    for (const entry of directory.files) {
      if (entry.type === "Directory") continue;
      const name = entry.path.split("/").pop() ?? entry.path;
      entries.set(name, (await entry.buffer()).toString("utf8"));
    }
  } catch {
    return NextResponse.json({ message: "File ZIP tidak valid" }, { status: 400 });
  }

  const errors: ImportError[] = [];

  // ---- Parse expected files (structure first, no writes) ----
  const lookupRows = new Map<LookupKey, CsvRow[]>();
  for (const table of LOOKUP_TABLES) {
    const parsed = parseRequiredFile(
      table.file,
      entries.get(table.file),
      LOOKUP_COLUMNS,
      errors,
    );
    if (parsed) lookupRows.set(table.key, parsed.rows);
  }
  const barangParsed = parseRequiredFile(
    BARANG_FILE,
    entries.get(BARANG_FILE),
    BARANG_COLUMNS,
    errors,
  );

  // ---- Validate lookup rows and collect the ids each CSV provides ----
  const csvIds = new Map<LookupKey, Set<number>>();
  for (const table of LOOKUP_TABLES) {
    const ids = new Set<number>();
    csvIds.set(table.key, ids);
    const rows = lookupRows.get(table.key);
    if (!rows) continue;

    rows.forEach((row, index) => {
      const line = index + 2; // +1 header, +1 zero-based index
      const id = asPositiveInt(cell(row, "id"));
      if (id === null) {
        errors.push({
          file: table.file,
          row: line,
          reason: "id harus berupa bilangan bulat positif",
        });
      } else {
        ids.add(id);
      }
      if (cell(row, "name") === "") {
        errors.push({
          file: table.file,
          row: line,
          reason: "Field wajib belum diisi: name",
        });
      }
    });
  }

  // ---- Snapshot existing ids (FK checks + created/updated counting) ----
  const [kategoriDb, keadaanDb, asalDb, satuanDb, lokasiDb, barangDb] =
    await Promise.all([
      prisma.kategoriBarang.findMany({ select: { id: true } }),
      prisma.keadaanBarang.findMany({ select: { id: true } }),
      prisma.asalBarang.findMany({ select: { id: true } }),
      prisma.satuanBarang.findMany({ select: { id: true } }),
      prisma.lokasiBarang.findMany({ select: { id: true } }),
      prisma.barang.findMany({ select: { id: true } }),
    ]);

  const dbIds: Record<LookupKey, Set<number>> = {
    kategori_barang: new Set(kategoriDb.map((row) => row.id)),
    keadaan_barang: new Set(keadaanDb.map((row) => row.id)),
    asal_barang: new Set(asalDb.map((row) => row.id)),
    satuan_barang: new Set(satuanDb.map((row) => row.id)),
    lokasi_barang: new Set(lokasiDb.map((row) => row.id)),
  };
  const barangIds = new Set(barangDb.map((row) => row.id));

  // An FK is valid if it exists in the DB or in the lookup CSV of this batch.
  const allowedIds = (key: LookupKey): Set<number> =>
    new Set([...dbIds[key], ...(csvIds.get(key) ?? [])]);

  // ---- Validate barang rows ----
  const barangRows = barangParsed?.rows ?? [];
  barangRows.forEach((row, index) => {
    const line = index + 2;
    const add = (reason: string) =>
      errors.push({ file: BARANG_FILE, row: line, reason });

    if (asPositiveInt(cell(row, "id")) === null) {
      add("id harus berupa bilangan bulat positif");
    }

    for (const { column, key, label } of FK_COLUMNS) {
      const raw = cell(row, column);
      if (raw === "") continue;
      const id = asPositiveInt(raw);
      if (id === null) {
        add(`${column} harus berupa bilangan bulat positif`);
      } else if (!allowedIds(key).has(id)) {
        add(`${column} merujuk ke ${label} yang tidak ada`);
      }
    }

    // Only nama_barang is required — kode_barang, no_register, jumlah and
    // harga are optional and imported as whatever the CSV holds.
    if (cell(row, "nama_barang") === "") add("Field wajib belum diisi: nama_barang");

    const jumlah = cell(row, "jumlah_barang");
    if (jumlah !== "" && (!Number.isInteger(Number(jumlah)) || Number(jumlah) < 0)) {
      add("jumlah_barang harus berupa bilangan bulat non-negatif");
    }

    const harga = cell(row, "harga_barang");
    if (harga !== "" && (Number.isNaN(Number(harga)) || Number(harga) < 0)) {
      add("harga_barang harus berupa angka non-negatif");
    }

    if (asOptionalInt(cell(row, "tahun_perolehan")) === undefined) {
      add("tahun_perolehan harus berupa bilangan bulat");
    }

    for (const column of ["created_at", "updated_at"]) {
      const raw = cell(row, column);
      if (raw !== "" && Number.isNaN(new Date(raw).getTime())) {
        add(`${column} harus berupa tanggal yang valid`);
      }
    }
  });

  if (errors.length > 0) {
    return NextResponse.json(
      { message: "Import gagal — tidak ada perubahan yang dilakukan", errors },
      { status: 400 },
    );
  }

  // ---- Upsert: lookups first, barang last, all in one transaction ----
  const summary: Record<string, { created: number; updated: number }> = {};

  await prisma.$transaction(
    async (tx) => {
      for (const table of LOOKUP_TABLES) {
        const rows = lookupRows.get(table.key) ?? [];
        let created = 0;
        let updated = 0;

        for (const row of rows) {
          const id = Number(cell(row, "id"));
          await upsertLookup(tx, table.key, id, cell(row, "name"));
          if (dbIds[table.key].has(id)) updated += 1;
          else created += 1;
        }

        summary[table.key] = { created, updated };
      }

      let created = 0;
      let updated = 0;

      for (const row of barangRows) {
        const id = Number(cell(row, "id"));
        const data = barangWriteData(row);
        await tx.barang.upsert({
          where: { id },
          create: { ...data, id },
          update: data,
        });
        if (barangIds.has(id)) updated += 1;
        else created += 1;
      }

      summary[BARANG_FILE.replace(".csv", "")] = { created, updated };
    },
    { timeout: 120_000, maxWait: 30_000 },
  );

  await logActivity({
    userId: decoded.userId,
    action: "CREATE",
    entity: "BACKUP",
    entityId: null,
    label: `dari file ${upload.name}`,
  });

  return NextResponse.json({
    message: "Import berhasil diselesaikan",
    summary,
  });
}
