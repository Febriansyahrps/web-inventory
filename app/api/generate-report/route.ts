import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getReportBarang } from "@/lib/reportData";
import { buildReportPdf } from "@/lib/reportPdf";
import { buildReportXlsx } from "@/lib/reportXlsx";

const CONTENT_TYPES = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

type ReportFile = keyof typeof CONTENT_TYPES;

const asOptionalString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

/** Download name: `Laporan Inventaris Masuk DD-MM-YYYY HH-MM-SS.<ext>`. */
function reportFilename(file: ReportFile, generatedAt: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  const date = [
    pad(generatedAt.getDate()),
    pad(generatedAt.getMonth() + 1),
    generatedAt.getFullYear(),
  ].join("-");
  const time = [
    pad(generatedAt.getHours()),
    pad(generatedAt.getMinutes()),
    pad(generatedAt.getSeconds()),
  ].join("-");

  return `Laporan Inventaris Masuk ${date} ${time}.${file}`;
}

export async function POST(req: Request) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  // ADMIN and VIEWER both allowed — only a valid token is required.

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Body request tidak valid" }, { status: 400 });
  }

  const file = body.file;
  if (file !== "pdf" && file !== "xlsx") {
    return NextResponse.json(
      { message: 'file wajib diisi dan harus "pdf" atau "xlsx"' },
      { status: 400 },
    );
  }

  const rangeDate = asOptionalString(body.range_date);
  const startDate = asOptionalString(body.start_date);
  const endDate = asOptionalString(body.end_date);

  try {
    const rows = await getReportBarang({ rangeDate, startDate, endDate });
    const generatedAt = new Date();
    const buffer =
      file === "pdf"
        ? await buildReportPdf(rows, generatedAt)
        : await buildReportXlsx(rows, generatedAt);

    const filename = reportFilename(file, generatedAt);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[file],
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("generate-report failed", err);
    return NextResponse.json(
      { message: "Gagal membuat laporan" },
      { status: 500 },
    );
  }
}
