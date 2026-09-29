import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { generateBackupZip } from "@/lib/exportBackup";
import { logActivity } from "@/lib/activityLog";

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

  const { buffer, filename } = await generateBackupZip();

  await logActivity({
    userId: decoded.userId,
    action: "DOWNLOAD",
    entity: "BACKUP",
    entityId: null,
    label: filename,
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
