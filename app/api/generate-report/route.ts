import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { resolveDateRange } from "@/lib/dateRange";
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

/** `YYYY-MM-DD` from a Date, in local time (matches the range boundaries). */
const ymd = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Download name describing the report's actual date window. */
function reportFilename(
  file: ReportFile,
  rangeDate: string | null,
  startDate: string | null,
  endDate: string | null,
): string {
  const { gte, lte } = resolveDateRange(rangeDate, startDate, endDate);

  let span = "semua";
  if (gte && lte) span = `${ymd(gte)}_${ymd(lte)}`;
  else if (gte) span = `dari_${ymd(gte)}`;
  else if (lte) span = `sampai_${ymd(lte)}`;

  return `laporan-barang-masuk-${span}.${file}`;
}

export async function POST(req: Request) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // ADMIN and VIEWER both allowed — only a valid token is required.

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const file = body.file;
  if (file !== "pdf" && file !== "xlsx") {
    return NextResponse.json(
      { message: 'file is required and must be "pdf" or "xlsx"' },
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

    const filename = reportFilename(file, rangeDate, startDate, endDate);

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
      { message: "Failed to generate report" },
      { status: 500 },
    );
  }
}
