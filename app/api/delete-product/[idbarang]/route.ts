import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { deletePhoto } from "@/lib/upload";
import { logActivity } from "@/lib/activityLog";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ idbarang: string }> }
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

  const { idbarang } = await params;
  const id = Number(idbarang);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ message: "Id barang tidak valid" }, { status: 400 });
  }

  const barang = await prisma.barang.findUnique({ where: { id } });
  if (!barang) {
    return NextResponse.json({ message: "Barang tidak ditemukan" }, { status: 404 });
  }

  // Delete the associated photo file (if any) to avoid orphaned files.
  if (barang.fotoBarang) {
    await deletePhoto(barang.fotoBarang);
  }

  await prisma.barang.delete({ where: { id } });

  await logActivity({
    userId: decoded.userId,
    action: "DELETE",
    entity: "BARANG",
    entityId: id,
    label: barang.namaBarang,
  });

  return NextResponse.json({
    message: "Barang berhasil dihapus",
    description: `Barang ${barang.namaBarang} telah dihapus.`,
  });
}
