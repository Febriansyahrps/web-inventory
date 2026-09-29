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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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
            "No barang activity in the last 24 hours — backup email not sent.",
        },
        { status: 200 },
      );
    }
  }

  try {
    const result = await sendBackupEmail(decoded.userId);
    return NextResponse.json({
      message: "Backup email sent successfully",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to send backup email",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
