import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBackupEmail } from "@/lib/sendBackupEmail";

export const maxDuration = 300;

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

  // Only the scheduled trigger is activity-gated. Manual/admin calls always
  // send on demand, so they skip the "anything changed?" check.
  const isScheduled = req.headers.get("x-scheduled-trigger") === "true";

  if (isScheduled) {
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentBarangActivity = await prisma.activityLog.findFirst({
      where: {
        entity: "BARANG",
        createdAt: { gte: windowStart },
      },
    });

    if (!recentBarangActivity) {
      return NextResponse.json(
        {
          message:
            "Tidak ada aktivitas barang dalam 24 jam terakhir — email backup tidak dikirim.",
        },
        { status: 200 },
      );
    }
  }

  try {
    const result = await sendBackupEmail(decoded.userId);
    return NextResponse.json({
      message: "Email backup berhasil dikirim",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Gagal mengirim email backup",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
