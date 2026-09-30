import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { resolveDateRange } from "@/lib/dateRange";
import { serializeBarang, barangInclude } from "@/lib/serialize";

// Whitelist for single-column sort: map API column names to Prisma field paths.
// Relation columns use the nested `{ relation: { name: dir } }` form; scalars use `{ field: dir }`.
const SORT_COLUMNS: Record<string, string> = {
  kode_barang: "kodeBarang",
  no_register: "noRegister",
  nama_barang: "namaBarang",
  merk_barang: "merkBarang",
  no_sertifikat: "noSertifikat",
  bahan: "bahan",
  tahun_perolehan: "tahunPerolehan",
  ukuran_barang: "ukuranBarang",
  jumlah_barang: "jumlahBarang",
  harga_barang: "hargaBarang",
  created_at: "createdAt",
  updated_at: "updatedAt",
};

// Relation-backed columns: map API column name -> Barang relation field.
const SORT_RELATIONS: Record<string, string> = {
  kategori_barang: "kategoriBarang",
  lokasi_barang: "lokasiBarang",
  asal_barang: "asalBarang",
  keadaan_barang: "keadaanBarang",
  satuan_barang: "satuanBarang",
};

function parseCsvIds(value: string | null): number[] | undefined {
  if (!value) return undefined;
  const ids = value
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return ids.length > 0 ? ids : undefined;
}

export async function GET(req: Request) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  // ADMIN and VIEWER both allowed — no further role gate needed.

  const { searchParams } = new URL(req.url);

  // ---- Pagination ----
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limitRaw = Number(searchParams.get("limit")) || 20;
  const limit = Math.min(Math.max(1, limitRaw), 100);

  // ---- Filters ----
  const search = searchParams.get("search");
  const kategori = parseCsvIds(searchParams.get("kategori"));
  const lokasi = parseCsvIds(searchParams.get("lokasi"));
  const asal_barang = parseCsvIds(searchParams.get("asal_barang"));
  const keadaan = parseCsvIds(searchParams.get("keadaan"));
  const satuan = parseCsvIds(searchParams.get("satuan"));

  const low_price = searchParams.get("low_price");
  const high_price = searchParams.get("high_price");

  const range_date = searchParams.get("range_date");
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");

  const where: Prisma.BarangWhereInput = {};

  if (search) {
    where.OR = [
      { namaBarang: { contains: search, mode: "insensitive" } },
      { merkBarang: { contains: search, mode: "insensitive" } },
      { kodeBarang: { contains: search, mode: "insensitive" } },
      { noRegister: { contains: search, mode: "insensitive" } },
      { noSertifikat: { contains: search, mode: "insensitive" } },
    ];
  }

  if (kategori) where.idKategoriBarang = { in: kategori };
  if (lokasi) where.idLokasiBarang = { in: lokasi };
  if (asal_barang) where.idAsalBarang = { in: asal_barang };
  if (keadaan) where.idKeadaanBarang = { in: keadaan };
  if (satuan) where.idSatuanBarang = { in: satuan };

  if (low_price !== null || high_price !== null) {
    where.hargaBarang = {};
    if (low_price !== null) {
      const low = Number(low_price);
      if (!Number.isNaN(low)) where.hargaBarang.gte = low;
    }
    if (high_price !== null) {
      const high = Number(high_price);
      if (!Number.isNaN(high)) where.hargaBarang.lte = high;
    }
  }

  // Date range filter on created_at (shared with /api/generate-report)
  const { gte, lte } = resolveDateRange(range_date, start_date, end_date);
  if (gte || lte) {
    where.createdAt = {};
    if (gte) where.createdAt.gte = gte;
    if (lte) where.createdAt.lte = lte;
  }

  // ---- Sort ----
  const sortParam = searchParams.get("sort");
  let orderBy: Prisma.BarangOrderByWithRelationInput | undefined;
  if (sortParam) {
    const idx = sortParam.lastIndexOf("_");
    const col = sortParam.slice(0, idx);
    const dir = sortParam.slice(idx + 1);
    const field = SORT_COLUMNS[col];
    const relation = SORT_RELATIONS[col];

    if (dir === "asc" || dir === "desc") {
      if (field) {
        orderBy = { [field]: dir };
      } else if (relation) {
        // Sort by the related lookup's name, e.g. kategoriBarang: { name: "asc" }.
        orderBy = { [relation]: { name: dir } };
      }
    }
  }

  // ---- Query ----
  const [totalProduct, stockAgg, assetAgg, rows] = await Promise.all([
    prisma.barang.count({ where }),
    // Sum of stock across all rows matching the filters (not just this page).
    prisma.barang.aggregate({ where, _sum: { jumlahBarang: true } }),
    // Sum of asset value across all rows matching the filters (not just this page).
    prisma.barang.aggregate({ where, _sum: { hargaBarang: true } }),
    prisma.barang.findMany({
      where,
      include: barangInclude,
      orderBy: orderBy ?? [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPage = Math.ceil(totalProduct / limit);
  const totalStock = stockAgg._sum.jumlahBarang ?? 0;
  const totalAssetValue = assetAgg._sum.hargaBarang?.toNumber() ?? 0;

  return NextResponse.json({
    data: rows.map(serializeBarang),
    page,
    total_page: totalPage,
    total_product: totalProduct,
    total_stock: totalStock,
    total_asset_value: totalAssetValue,
    limit,
  });
}
