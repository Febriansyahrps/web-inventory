import { NextResponse } from "next/server";
import { triggerBackupEmailCheck } from "@/lib/scheduledBackupTrigger";

// Vercel Cron invokes this with an HTTP GET and, when CRON_SECRET is set,
// authenticates with `Authorization: Bearer <CRON_SECRET>`.
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  await triggerBackupEmailCheck();

  return NextResponse.json({ message: "Pemeriksaan backup dijalankan" });
}
