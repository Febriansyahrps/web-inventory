import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const rowId = Number(id);
  if (!Number.isInteger(rowId)) {
    return NextResponse.json({ message: "Id tidak valid" }, { status: 400 });
  }

  const existing = await prisma.kategoriBarang.findUnique({ where: { id: rowId } });
  if (!existing) {
    return NextResponse.json({ message: "Kategori barang tidak ditemukan" }, { status: 404 });
  }

  await prisma.kategoriBarang.delete({ where: { id: rowId } });

  return NextResponse.json({
    message: "Kategori barang berhasil dihapus",
    description: `${existing.name} telah dihapus.`,
  });
}
