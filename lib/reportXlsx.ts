// lib/reportXlsx.ts — XLSX renderer for the monthly arrival report
// ("Laporan Bulanan Inventaris Barang Masuk").
//
// Same title, columns and rows as the PDF (see lib/reportModel.ts), but written
// as real spreadsheet cells: dates and numbers stay numeric, with a number
// format, instead of being flattened to display strings. Page setup is
// landscape so printing matches the PDF.

import { readFileSync } from "node:fs";
import path from "node:path";
import { Workbook } from "exceljs";
import type { Cell, Worksheet } from "exceljs";
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
  reportRowValues,
} from "@/lib/reportModel";

const HEADER_FILL = "FFF2EDE3";
const HEADER_FONT = "FF1F1F1F";
const BORDER_COLOR = "FF9AA0A6";

// Excel column width is in character units; scale the shared weights so the
// 17 columns roughly fill a landscape A4 sheet.
const CHAR_PER_WEIGHT = 7.5;
const MIN_COL_WIDTH = 4;

const SIGNATURE_COLUMNS = [1, 7, 14]; // A, G, N — spread across the sheet.
const SIGNATURE_IMAGE_HEIGHT = 38; // px

/** Read a signature PNG from the deployed project root. */
const signatureImage = (relativePath: string): Buffer =>
  readFileSync(path.join(process.cwd(), relativePath));

const columnLetter = (index: number): string => {
  let n = index;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
};

const LAST_COLUMN = columnLetter(REPORT_COLUMNS.length);

const thinBorder = {
  top: { style: "thin" as const, color: { argb: BORDER_COLOR } },
  left: { style: "thin" as const, color: { argb: BORDER_COLOR } },
  bottom: { style: "thin" as const, color: { argb: BORDER_COLOR } },
  right: { style: "thin" as const, color: { argb: BORDER_COLOR } },
};

const writeCellValue = (cell: Cell, value: unknown, numFmt?: string) => {
  // Nullish cells show "-" (same convention as the PDF/product table).
  if (value === null || value === undefined || value === "") {
    cell.value = "-";
  } else {
    cell.value = value as Cell["value"];
  }
  if (numFmt) cell.numFmt = numFmt;
};

function renderSheet(
  workbook: Workbook,
  worksheet: Worksheet,
  rows: ReportBarang[],
  generatedAt: Date,
) {
  // ---- Column widths (from the shared weights) ----
  REPORT_COLUMNS.forEach((column, i) => {
    worksheet.getColumn(i + 1).width = Math.max(
      MIN_COL_WIDTH,
      Math.round((column.weight / REPORT_TOTAL_WEIGHT) * 16 * CHAR_PER_WEIGHT),
    );
  });

  // ---- Title block ----
  worksheet.mergeCells(`A1:${LAST_COLUMN}1`);
  const title = worksheet.getCell("A1");
  title.value = REPORT_TITLE;
  title.font = { bold: true, size: 13 };
  title.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells(`A2:${LAST_COLUMN}2`);
  const subtitle = worksheet.getCell("A2");
  subtitle.value = REPORT_SUBTITLE;
  subtitle.font = { bold: true, size: 11 };
  subtitle.alignment = { horizontal: "center", vertical: "middle" };

  // ---- Contact block (address / phone / email) ----
  REPORT_CONTACT_LINES.forEach((line, i) => {
    const rowNumber = 3 + i;
    worksheet.mergeCells(`A${rowNumber}:${LAST_COLUMN}${rowNumber}`);
    const cell = worksheet.getCell(`A${rowNumber}`);
    cell.value = line;
    cell.font = { size: 9 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // ---- Rule dividing the header block from the table body ----
  const dividerRowNumber = 2 + REPORT_CONTACT_LINES.length;
  for (let column = 1; column <= REPORT_COLUMNS.length; column += 1) {
    worksheet.getCell(dividerRowNumber, column).border = {
      bottom: { style: "medium", color: { argb: BORDER_COLOR } },
    };
  }

  // ---- Header row (one blank row below the title block) ----
  const headerRowNumber = 3 + REPORT_CONTACT_LINES.length + 1;
  worksheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

  const headerRow = worksheet.getRow(headerRowNumber);
  REPORT_HEADERS.forEach((title, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = title;
    cell.font = { bold: true, color: { argb: HEADER_FONT } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
    cell.alignment = {
      horizontal: REPORT_COLUMNS[i].align ?? "left",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = thinBorder;
  });
  headerRow.commit();

  // ---- Data rows ----
  let rowIndex = headerRowNumber + 1;
  for (const [index, row] of rows.entries()) {
    const values = reportRowValues(row, index);
    const excelRow = worksheet.getRow(rowIndex);

    values.forEach((value, i) => {
      const cell = excelRow.getCell(i + 1);
      writeCellValue(cell, value, REPORT_COLUMNS[i].numFmt);
      cell.alignment = {
        horizontal: REPORT_COLUMNS[i].align ?? "left",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = thinBorder;
    });

    excelRow.commit();
    rowIndex += 1;
  }

  // ---- Signature block (image + name per signatory) ----
  rowIndex += 1;

  worksheet.mergeCells(`A${rowIndex}:${LAST_COLUMN}${rowIndex}`);
  const dateCell = worksheet.getCell(`A${rowIndex}`);
  dateCell.value = `Banjarnegara, ${formatLongDate(generatedAt)}`;
  dateCell.alignment = { horizontal: "right" };
  rowIndex += 2;

  const labelsRow = rowIndex;
  const imagesRow = labelsRow + 1;
  const namesRow = imagesRow + 2;
  worksheet.getRow(imagesRow).height = 30;

  REPORT_SIGNATURES.forEach((signature, i) => {
    const column = SIGNATURE_COLUMNS[i];
    worksheet.getCell(labelsRow, column).value = signature.role;
    worksheet.getCell(namesRow, column).value = signature.name;

    const buffer = signatureImage(signature.imagePath);
    const size = pngSize(buffer);
    const height = SIGNATURE_IMAGE_HEIGHT;
    const width = (size.width / size.height) * height;

    // exceljs declares its own Buffer type, which Node's does not satisfy.
    const imageId = workbook.addImage({
      buffer: buffer as never,
      extension: "png",
    });
    worksheet.addImage(imageId, {
      tl: { col: column - 1, row: imagesRow - 1 },
      ext: { width, height },
    });
  });
}

/**
 * Render the report rows to an XLSX buffer with landscape page setup.
 *
 * Returns a Buffer so the caller can set response headers and fail with a real
 * status code; the buffer is sent as the raw response body.
 */
export async function buildReportXlsx(
  rows: ReportBarang[],
  generatedAt: Date = new Date(),
): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = "Sistem Inventaris SMK Tamansiswa Banjarnegara";
  workbook.created = generatedAt;

  const worksheet = workbook.addWorksheet("Laporan Barang Masuk", {
    pageSetup: { orientation: "landscape" },
  });

  renderSheet(workbook, worksheet, rows, generatedAt);

  // Explicit as well as via constructor options, so the print orientation is
  // always persisted regardless of how the sheet was created.
  worksheet.pageSetup.orientation = "landscape";

  // exceljs declares its own `Buffer` type that shadows Node's, so normalize
  // through ArrayBuffer rather than asserting the types line up.
  const written = (await workbook.xlsx.writeBuffer()) as unknown as ArrayBuffer;
  return Buffer.from(new Uint8Array(written));
}
