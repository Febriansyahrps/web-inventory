// lib/reportData.ts — data source for the monthly arrival report
// ("Laporan Bulanan Inventaris Barang Masuk").
//
// Shared by /api/generate-report so the PDF and XLSX renderers always use the
// exact same rows in the same order.

import { Prisma } from "@prisma/client";
import { resolveDateRange } from "@/lib/dateRange";
import { prisma } from "@/lib/prisma";
import { barangInclude } from "@/lib/serialize";

/** A report row: a Barang with its four lookup relations expanded. */
export type ReportBarang = Prisma.BarangGetPayload<{
  include: typeof barangInclude;
}>;

export interface ReportRangeParams {
  /** Preset: "this_week" | "this_month" | "this_year" (or the short aliases). */
  rangeDate?: string | null;
  /** Used only when `rangeDate` is omitted. */
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * Fetch every `barang` that arrived within the resolved date range, oldest
 * first (chronological, matching a physical logbook style), with the
 * Kategori/Asal/Keadaan/Satuan relations included.
 */
export async function getReportBarang({
  rangeDate,
  startDate,
  endDate,
}: ReportRangeParams): Promise<ReportBarang[]> {
  const { gte, lte } = resolveDateRange(rangeDate, startDate, endDate);

  const where: Prisma.BarangWhereInput = {};
  if (gte || lte) {
    where.createdAt = {};
    if (gte) where.createdAt.gte = gte;
    if (lte) where.createdAt.lte = lte;
  }

  return prisma.barang.findMany({
    where,
    include: barangInclude,
    // Oldest first; `id` keeps same-timestamp rows in a stable order.
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}
