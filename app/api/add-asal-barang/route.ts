import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
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
  const existing = await prisma.asalBarang.findFirst({
    where: { name: trimmed },
  });
  if (existing) {
    return NextResponse.json(
      { message: "Asal barang dengan nama tersebut sudah ada" },
      { status: 400 }
    );
  }

  const row = await prisma.asalBarang.create({ data: { name: trimmed } });

  return NextResponse.json({
    message: "Asal barang berhasil dibuat",
    data: { id: row.id, name: row.name },
  });
}
