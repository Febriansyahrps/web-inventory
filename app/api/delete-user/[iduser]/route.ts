import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ iduser: string }> }
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

  const { iduser } = await params;
  const id = Number(iduser);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ message: "Id pengguna tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  await logActivity({
    // An admin deleting their own account no longer exists to reference.
    userId: decoded.userId === id ? null : decoded.userId,
    action: "DELETE",
    entity: "USER",
    entityId: id,
    label: user.username,
  });

  return NextResponse.json({
    message: "Pengguna berhasil dihapus",
    description: `Pengguna ${user.username} telah dihapus.`,
  });
}
