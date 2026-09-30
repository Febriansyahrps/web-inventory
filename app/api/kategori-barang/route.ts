import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  // ADMIN and VIEWER both allowed — no further role gate needed.

  const rows = await prisma.kategoriBarang.findMany({
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ data: rows });
}
