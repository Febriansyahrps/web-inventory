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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { idbarang } = await params;
  const id = Number(idbarang);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ message: "Invalid product id" }, { status: 400 });
  }

  const barang = await prisma.barang.findUnique({ where: { id } });
  if (!barang) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
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
    message: "Product deleted successfully",
    description: `Product ${barang.namaBarang} has been removed.`,
  });
}
