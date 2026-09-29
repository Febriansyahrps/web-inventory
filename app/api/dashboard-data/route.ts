import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Label for rows whose lookup FK is null (deleted lookup reference).
const UNKNOWN_LABEL = "Tidak diketahui";

export async function GET(req: Request) {
  try {
    verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // ADMIN and VIEWER both allowed — no further role gate needed.

  // ---- Queries (Task 1), run concurrently (Task 2) ----
  const [
    totalProduct,
    stockAgg,
    assetAgg,
    byKategoriRaw,
    byAsalRaw,
    byKeadaanRaw,
    kategoriRows,
    asalRows,
    keadaanRows,
    recentRows,
  ] = await Promise.all([
    prisma.barang.count(),
    prisma.barang.aggregate({ _sum: { jumlahBarang: true } }),
    prisma.barang.aggregate({ _sum: { hargaBarang: true } }),
    prisma.barang.groupBy({ by: ["idKategoriBarang"], _count: { _all: true } }),
    prisma.barang.groupBy({ by: ["idAsalBarang"], _count: { _all: true } }),
    prisma.barang.groupBy({ by: ["idKeadaanBarang"], _count: { _all: true } }),
    prisma.kategoriBarang.findMany({ select: { id: true, name: true } }),
    prisma.asalBarang.findMany({ select: { id: true, name: true } }),
    prisma.keadaanBarang.findMany({ select: { id: true, name: true } }),
    prisma.barang.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { kategoriBarang: true },
    }),
  ]);

  // ---- Shape the response (Task 3) ----
  const nameById = (rows: { id: number; name: string }[]) =>
    new Map(rows.map((row) => [row.id, row.name]));

  // Map grouped FK counts to { id, name, count }; a null FK becomes a labelled
  // group (not dropped), and an unknown id falls back to the same label.
  const breakdown = (
    groups: { id: number | null; count: number }[],
    names: Map<number, string>,
  ) =>
    groups
      .map(({ id, count }) => ({
        id,
        name: id === null ? UNKNOWN_LABEL : (names.get(id) ?? UNKNOWN_LABEL),
        count,
      }))
      .sort((a, b) => b.count - a.count);

  const byCategory = breakdown(
    byKategoriRaw.map((g) => ({
      id: g.idKategoriBarang,
      count: g._count._all,
    })),
    nameById(kategoriRows),
  );
  const byAsal = breakdown(
    byAsalRaw.map((g) => ({ id: g.idAsalBarang, count: g._count._all })),
    nameById(asalRows),
  );
  const byKeadaan = breakdown(
    byKeadaanRaw.map((g) => ({ id: g.idKeadaanBarang, count: g._count._all })),
    nameById(keadaanRows),
  );

  // No id_user here (same exclusion rule as /api/product).
  const recent = recentRows.map((row) => ({
    id: row.id,
    kode_barang: row.kodeBarang,
    nama_barang: row.namaBarang,
    kategori_barang: row.kategoriBarang
      ? { id: row.kategoriBarang.id, name: row.kategoriBarang.name }
      : null,
    jumlah_barang: row.jumlahBarang,
    created_at: row.createdAt,
  }));

  return NextResponse.json({
    total_product: totalProduct,
    total_stock: stockAgg._sum.jumlahBarang ?? 0,
    total_asset_value: assetAgg._sum.hargaBarang?.toNumber() ?? 0,
    by_category: byCategory,
    by_asal: byAsal,
    by_keadaan: byKeadaan,
    recent,
  });
}
