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

  const existing = await prisma.lokasiBarang.findUnique({ where: { id: rowId } });
  if (!existing) {
    return NextResponse.json({ message: "Lokasi barang not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const name = body.name;
  if (typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ message: "name is required" }, { status: 400 });
  }

  const trimmed = name.trim();
  const dup = await prisma.lokasiBarang.findFirst({
    where: { name: trimmed, id: { not: rowId } },
  });
  if (dup) {
    return NextResponse.json(
      { message: "Lokasi barang with that name already exists" },
      { status: 400 }
    );
  }

  await prisma.lokasiBarang.update({
    where: { id: rowId },
    data: { name: trimmed },
  });

  return NextResponse.json({ message: "Lokasi barang updated successfully" });
}
