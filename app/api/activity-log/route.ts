import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// action/entity codes -> the Indonesian words used in the generated `message`.
const ACTION_VERB: Record<string, string> = {
  CREATE: "menambahkan",
  UPDATE: "memperbarui",
  DELETE: "menghapus",
  DOWNLOAD: "mengunduh",
  EMAIL: "mengirim",
};

const ENTITY_NOUN: Record<string, string> = {
  BARANG: "barang",
  USER: "akun",
  BACKUP: "backup",
};

export async function GET(req: Request) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  // ---- Pagination ----
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limitRaw = Number(searchParams.get("limit")) || 20;
  const limit = Math.min(Math.max(1, limitRaw), 100);

  const [totalLog, logs] = await Promise.all([
    prisma.activityLog.count(),
    prisma.activityLog.findMany({
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPage = Math.ceil(totalLog / limit);

  // `message` is generated per row at read time, not stored. The actor is left
  // out of it — it already has its own `user` field (and table column).
  const data = logs.map((log) => {
    const verb = ACTION_VERB[log.action] ?? log.action.toLowerCase();
    const noun = ENTITY_NOUN[log.entity] ?? log.entity.toLowerCase();

    return {
      id: log.id,
      user: log.user ? { id: log.user.id, username: log.user.username } : null,
      action: log.action,
      entity: log.entity,
      entity_id: log.entityId,
      label: log.label,
      message: `${verb} ${noun} ${log.label}`,
      created_at: log.createdAt,
    };
  });

  return NextResponse.json({
    data,
    page,
    total_page: totalPage,
    total_log: totalLog,
    limit,
  });
}
