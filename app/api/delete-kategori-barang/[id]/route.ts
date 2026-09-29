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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const rowId = Number(id);
  if (!Number.isInteger(rowId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  const existing = await prisma.kategoriBarang.findUnique({ where: { id: rowId } });
  if (!existing) {
    return NextResponse.json({ message: "Kategori barang not found" }, { status: 404 });
  }

  await prisma.kategoriBarang.delete({ where: { id: rowId } });

  return NextResponse.json({
    message: "Kategori barang deleted successfully",
    description: `${existing.name} has been removed.`,
  });
}
