// lib/reportPdf.ts — PDF renderer for the monthly arrival report
// ("Laporan Bulanan Inventaris Barang Masuk").
//
// Landscape A4, a flat 17-column table with row-height tracking + page breaks,
// and the static signature block. pdfkit does not paginate tables itself, so
// every row is measured before it is drawn and a new page is started (with the
// header row repeated) when it would overflow.
//
// Column definitions and values come from lib/reportModel.ts, shared with the
// XLSX renderer.

import { readFileSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { ReportBarang } from "@/lib/reportData";
import {
  formatLongDate,
  REPORT_COLUMNS,
  REPORT_CONTACT_LINES,
  REPORT_HEADERS,
  REPORT_SIGNATURES,
  REPORT_SUBTITLE,
  REPORT_TITLE,
  REPORT_TOTAL_WEIGHT,
  pngSize,
  reportRowDisplay,
} from "@/lib/reportModel";

// ---- Page / layout constants (all in PDF points) ----
const PAGE_MARGIN = 30;
const CELL_PAD_X = 3;
const CELL_PAD_Y = 3;
const FONT_SIZE = 7;
const HEADER_FONT_SIZE = 7.5;
const MIN_ROW_HEIGHT = 16;
const GRID_COLOR = "#9AA0A6";
const HEADER_FILL = "#F2EDE3";
const TITLE_SIZE = 13;
const SUBTITLE_SIZE = 11;
const CONTACT_SIZE = 8;
const SIGNATURE_SIZE = 9;
const SIGNATURE_LINE = 13;
const SIGNATURE_RESERVE = 150;
const SIGNATURE_IMAGE_HEIGHT = 38;

/** Read a signature PNG from the deployed project root. */
const signatureImage = (relativePath: string): Buffer =>
  readFileSync(path.join(process.cwd(), relativePath));

function render(
  doc: PDFKit.PDFDocument,
  rows: ReportBarang[],
  generatedAt: Date,
) {
  const contentWidth = doc.page.width - PAGE_MARGIN * 2;
  const contentBottom = doc.page.height - PAGE_MARGIN;

  const colWidths = REPORT_COLUMNS.map(
    (column) => (column.weight / REPORT_TOTAL_WEIGHT) * contentWidth,
  );

  let y = PAGE_MARGIN;

  // ---- Title block (static, centered) ----
  doc
    .fillColor("black")
    .font("Helvetica-Bold")
    .fontSize(TITLE_SIZE)
    .text(REPORT_TITLE, PAGE_MARGIN, y, {
      width: contentWidth,
      align: "center",
    });
  y = doc.y + 2;
  doc.fontSize(SUBTITLE_SIZE).text(REPORT_SUBTITLE, PAGE_MARGIN, y, {
    width: contentWidth,
    align: "center",
  });

  // Contact block (address / phone / email), centered under the school name.
  doc.font("Helvetica").fontSize(CONTACT_SIZE);
  REPORT_CONTACT_LINES.forEach((line) => {
    doc.text(line, PAGE_MARGIN, doc.y + 1, {
      width: contentWidth,
      align: "center",
    });
  });

  // Rule dividing the header block from the table body.
  y = doc.y + 6;
  doc
    .strokeColor("black")
    .lineWidth(1)
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_MARGIN + contentWidth, y)
    .stroke();
  y += 10;

  /** Height a row needs so its tallest cell fits without clipping. */
  const measureRow = (cells: string[], bold: boolean): number => {
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? HEADER_FONT_SIZE : FONT_SIZE);
    const tallest = Math.max(
      ...cells.map((text, i) =>
        doc.heightOfString(text, { width: colWidths[i] - CELL_PAD_X * 2 }),
      ),
    );
    return Math.max(MIN_ROW_HEIGHT, Math.ceil(tallest) + CELL_PAD_Y * 2);
  };

  const drawRow = (
    cells: string[],
    top: number,
    height: number,
    bold: boolean,
  ) => {
    let x = PAGE_MARGIN;
    cells.forEach((text, i) => {
      const width = colWidths[i];

      if (bold) {
        doc.fillColor(HEADER_FILL).rect(x, top, width, height).fill();
      }
      doc
        .strokeColor(GRID_COLOR)
        .lineWidth(0.5)
        .rect(x, top, width, height)
        .stroke();

      doc
        .fillColor("black")
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(bold ? HEADER_FONT_SIZE : FONT_SIZE)
        .text(text, x + CELL_PAD_X, top + CELL_PAD_Y, {
          width: width - CELL_PAD_X * 2,
          height: height - CELL_PAD_Y * 2,
          align: REPORT_COLUMNS[i].align ?? "left",
          ellipsis: true,
        });

      x += width;
    });
  };

  const headerHeight = measureRow(REPORT_HEADERS, true);

  const drawHeader = (top: number) => {
    drawRow(REPORT_HEADERS, top, headerHeight, true);
  };

  drawHeader(y);
  y += headerHeight;

  // ---- Data rows (page break before a row that would overflow) ----
  rows.forEach((row, index) => {
    const cells = reportRowDisplay(row, index);
    const height = measureRow(cells, false);

    if (y + height > contentBottom) {
      doc.addPage();
      y = PAGE_MARGIN;
      drawHeader(y);
      y += headerHeight;
    }

    drawRow(cells, y, height, false);
    y += height;
  });

  // ---- Signature block (image + name per signatory) ----
  if (y + SIGNATURE_RESERVE > contentBottom) {
    doc.addPage();
    y = PAGE_MARGIN;
  } else {
    y += 16;
  }

  // "Banjarnegara, <generation date>" — right aligned to the outer margin.
  const dateText = `Banjarnegara, ${formatLongDate(generatedAt)}`;
  doc
    .font("Helvetica")
    .fontSize(SIGNATURE_SIZE)
    .fillColor("black")
    .text(dateText, PAGE_MARGIN, y, {
      width: contentWidth,
      align: "right",
      lineBreak: false,
    });

  /** Draw `text` centered on `centerX`. */
  const label = (text: string, centerX: number, top: number) => {
    doc.font("Helvetica").fontSize(SIGNATURE_SIZE).fillColor("black");
    doc.text(text, centerX - doc.widthOfString(text) / 2, top, {
      lineBreak: false,
    });
  };

  // One column per signatory, evenly spread across the content width.
  const columnWidth = contentWidth / REPORT_SIGNATURES.length;
  const centerOf = (index: number) =>
    PAGE_MARGIN + columnWidth * (index + 0.5);

  const labelsTop = y + SIGNATURE_LINE + 8;
  const imagesTop = labelsTop + SIGNATURE_LINE + 2;
  const namesTop = imagesTop + SIGNATURE_IMAGE_HEIGHT + 6;

  REPORT_SIGNATURES.forEach((signature, index) => {
    const centerX = centerOf(index);
    label(signature.role, centerX, labelsTop);

    const png = signatureImage(signature.imagePath);
    const size = pngSize(png);
    const width = (size.width / size.height) * SIGNATURE_IMAGE_HEIGHT;
    doc.image(png, centerX - width / 2, imagesTop, {
      width,
      height: SIGNATURE_IMAGE_HEIGHT,
    });

    label(signature.name, centerX, namesTop);
  });
}

/**
 * Render the report rows to a PDF buffer (landscape A4).
 *
 * Returns a Buffer rather than a live stream so the caller can set response
 * headers and still fail with a real status code if rendering throws — the
 * buffer is sent as the raw response body, so the client downloads it directly.
 */
export function buildReportPdf(
  rows: ReportBarang[],
  generatedAt: Date = new Date(),
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: PAGE_MARGIN,
  });

  const done = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  render(doc, rows, generatedAt);
  doc.end();

  return done;
}
