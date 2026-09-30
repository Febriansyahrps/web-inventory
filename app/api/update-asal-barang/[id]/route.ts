import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
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

  const existing = await prisma.asalBarang.findUnique({ where: { id: rowId } });
  if (!existing) {
    return NextResponse.json({ message: "Asal barang tidak ditemukan" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Body request tidak valid" }, { status: 400 });
  }

  const name = body.name;
  if (typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ message: "nama wajib diisi" }, { status: 400 });
  }

  const trimmed = name.trim();
  const dup = await prisma.asalBarang.findFirst({
    where: { name: trimmed, id: { not: rowId } },
  });
  if (dup) {
    return NextResponse.json(
      { message: "Asal barang dengan nama tersebut sudah ada" },
      { status: 400 }
    );
  }

  await prisma.asalBarang.update({
    where: { id: rowId },
    data: { name: trimmed },
  });

  return NextResponse.json({ message: "Asal barang berhasil diperbarui" });
}
