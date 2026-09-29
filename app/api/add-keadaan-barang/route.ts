import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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
  const existing = await prisma.keadaanBarang.findFirst({
    where: { name: trimmed },
  });
  if (existing) {
    return NextResponse.json(
      { message: "Keadaan barang with that name already exists" },
      { status: 400 }
    );
  }

  const row = await prisma.keadaanBarang.create({ data: { name: trimmed } });

  return NextResponse.json({
    message: "Keadaan barang created successfully",
    data: { id: row.id, name: row.name },
  });
}
