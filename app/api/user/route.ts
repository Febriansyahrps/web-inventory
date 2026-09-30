import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Whitelist for single-column sort: map API column names to Prisma field paths.
const SORT_COLUMNS: Record<string, string> = {
  username: "username",
  fullname: "fullname",
  created_at: "createdAt",
  updated_at: "updatedAt",
};

// Relation-backed columns: map API column name -> User relation field.
const SORT_RELATIONS: Record<string, string> = {
  role: "role",
};

export async function GET(req: Request) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  // ---- Pagination ----
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limitRaw = Number(searchParams.get("limit")) || 20;
  const limit = Math.min(Math.max(1, limitRaw), 100);

  // ---- Filters ----
  const role = searchParams.get("role");
  const search = searchParams.get("search");

  const where: Prisma.UserWhereInput = {};
  if (role) where.idRole = Number(role);
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { fullname: { contains: search, mode: "insensitive" } },
    ];
  }

  // ---- Sort ----
  const sortParam = searchParams.get("sort");
  let orderBy: Prisma.UserOrderByWithRelationInput | undefined;
  if (sortParam) {
    const idx = sortParam.lastIndexOf("_");
    const col = sortParam.slice(0, idx);
    const dir = sortParam.slice(idx + 1);
    const field = SORT_COLUMNS[col];
    const relation = SORT_RELATIONS[col];

    if (dir === "asc" || dir === "desc") {
      if (field) {
        orderBy = { [field]: dir };
      } else if (relation) {
        // Sort by the related role's name, e.g. role: { name: "asc" }.
        orderBy = { [relation]: { name: dir } };
      }
    }
  }

  // ---- Query ----
  const [totalUser, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        fullname: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: orderBy ?? { id: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPage = Math.ceil(totalUser / limit);

  return NextResponse.json({
    data: users,
    page,
    total_page: totalPage,
    total_user: totalUser,
    limit,
  });
}
