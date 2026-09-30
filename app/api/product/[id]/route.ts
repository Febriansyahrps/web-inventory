import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { serializeBarang, barangInclude } from "@/lib/serialize";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  // ADMIN and VIEWER both allowed — no further role gate needed.

  const { id } = await params;
  const barangId = Number(id);
  if (!Number.isInteger(barangId)) {
    return NextResponse.json({ message: "Id barang tidak valid" }, { status: 400 });
  }

  const row = await prisma.barang.findUnique({
    where: { id: barangId },
    include: barangInclude,
  });

  if (!row) {
    return NextResponse.json({ message: "Barang tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ data: serializeBarang(row) });
}
