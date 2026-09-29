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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // ADMIN and VIEWER both allowed — no further role gate needed.

  const { id } = await params;
  const barangId = Number(id);
  if (!Number.isInteger(barangId)) {
    return NextResponse.json({ message: "Invalid product id" }, { status: 400 });
  }

  const row = await prisma.barang.findUnique({
    where: { id: barangId },
    include: barangInclude,
  });

  if (!row) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ data: serializeBarang(row) });
}
