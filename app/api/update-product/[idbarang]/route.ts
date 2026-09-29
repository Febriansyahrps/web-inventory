import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { savePhoto, deletePhoto } from "@/lib/upload";
import { logActivity } from "@/lib/activityLog";

// Required (NOT NULL) text columns — cannot be cleared to null.
const REQUIRED_TEXT = ["kode_barang", "no_register", "nama_barang"] as const;
// Required numeric columns — 0 is invalid as a "clear" signal.
const REQUIRED_NUM = ["jumlah_barang", "harga_barang"] as const;
// Nullable text columns — empty string clears to null.
const NULLABLE_TEXT = ["merk_barang", "no_sertifikat", "bahan", "ukuran_barang"] as const;
// Nullable int column — 0 clears to null.
const NULLABLE_INT = "tahun_perolehan";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ idbarang: string }> }
) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { idbarang } = await params;
  const id = Number(idbarang);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ message: "Invalid product id" }, { status: 400 });
  }

  const existing = await prisma.barang.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Invalid multipart body" }, { status: 400 });
  }

  const get = (k: string): string | undefined => {
    const v = form.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const has = (k: string): boolean => form.has(k);

  const data: Record<string, unknown> = {};

  // ---- Required text fields: present non-empty → update; empty → 400 ----
  for (const field of REQUIRED_TEXT) {
    if (!has(field)) continue;
    const v = get(field);
    if (v === undefined || v.trim() === "") {
      return NextResponse.json(
        { message: `${field} cannot be empty` },
        { status: 400 }
      );
    }
    data[fieldToPrisma(field)] = v;
  }

  // ---- Required numeric fields: present → must parse to a valid non-negative number ----
  for (const field of REQUIRED_NUM) {
    if (!has(field)) continue;
    const v = get(field);
    const n = Number(v);
    if (v === undefined || v === "" || Number.isNaN(n) || n < 0) {
      return NextResponse.json(
        { message: `${field} must be a non-negative number` },
        { status: 400 }
      );
    }
    data[fieldToPrisma(field)] = n;
  }

  // ---- Nullable text fields: empty string clears to null ----
  for (const field of NULLABLE_TEXT) {
    if (!has(field)) continue;
    const v = get(field);
    if (v !== undefined && v.trim() === "") {
      data[fieldToPrisma(field)] = null;
    } else if (v !== undefined) {
      data[fieldToPrisma(field)] = v;
    }
  }

  // ---- Nullable int field: empty or 0 clears to null ----
  if (has(NULLABLE_INT)) {
    const v = get(NULLABLE_INT);
    if (v === undefined || v.trim() === "" || Number(v) === 0) {
      data[fieldToPrisma(NULLABLE_INT)] = null;
    } else {
      const n = Number(v);
      if (Number.isNaN(n)) {
        return NextResponse.json(
          { message: `${NULLABLE_INT} must be an integer` },
          { status: 400 }
        );
      }
      data[fieldToPrisma(NULLABLE_INT)] = n;
    }
  }

  // ---- FK fields: validate & update when provided ----
  const fkFields: Record<string, string> = {
    id_kategori_barang: "idKategoriBarang",
    id_lokasi_barang: "idLokasiBarang",
    id_asal_barang: "idAsalBarang",
    id_keadaan_barang: "idKeadaanBarang",
    id_satuan_barang: "idSatuanBarang",
  };
  for (const [apiField, prismaField] of Object.entries(fkFields)) {
    if (!has(apiField)) continue;
    const v = get(apiField);
    const n = Number(v);
    if (v === undefined || v === "" || !Number.isInteger(n) || n <= 0) {
      return NextResponse.json(
        { message: `${apiField} must be a positive integer` },
        { status: 400 }
      );
    }
    data[prismaField] = n;
  }
  // FK existence checks (only for FKs being updated)
  const modelByField: Record<string, { findUnique: (a: { where: { id: number } }) => Promise<unknown> }> = {
    idKategoriBarang: prisma.kategoriBarang,
    idLokasiBarang: prisma.lokasiBarang,
    idAsalBarang: prisma.asalBarang,
    idKeadaanBarang: prisma.keadaanBarang,
    idSatuanBarang: prisma.satuanBarang,
  };
  for (const [prismaField, model] of Object.entries(modelByField)) {
    if (data[prismaField] !== undefined) {
      const row = await model.findUnique({ where: { id: data[prismaField] as number } });
      if (!row) {
        const apiName = Object.keys(fkFields).find((k) => fkFields[k] === prismaField);
        return NextResponse.json(
          { message: `Referenced row not found for: ${apiName}` },
          { status: 400 }
        );
      }
    }
  }

  // ---- Photo handling ----
  const fotoFile = form.get("foto");
  const deleteFoto = get("delete_foto");

  if (fotoFile instanceof File && deleteFoto === "true") {
    return NextResponse.json(
      { message: "Provide either foto or delete_foto, not both" },
      { status: 400 }
    );
  }

  if (fotoFile instanceof File) {
    // New file → replace old photo (if any)
    let newPath: string;
    try {
      newPath = await savePhoto(fotoFile);
    } catch (e) {
      return NextResponse.json(
        { message: (e as Error).message },
        { status: 400 }
      );
    }
    if (existing.fotoBarang) await deletePhoto(existing.fotoBarang);
    data.fotoBarang = newPath;
  } else if (deleteFoto === "true") {
    // delete_foto → remove existing photo
    if (existing.fotoBarang) await deletePhoto(existing.fotoBarang);
    data.fotoBarang = null;
  }
  // Neither provided → fotoBarang untouched.

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: "No fields to update" }, { status: 400 });
  }

  await prisma.barang.update({ where: { id }, data });

  await logActivity({
    userId: decoded.userId,
    action: "UPDATE",
    entity: "BARANG",
    entityId: id,
    label:
      typeof data.namaBarang === "string" ? data.namaBarang : existing.namaBarang,
  });

  return NextResponse.json({ message: "Product updated successfully" });
}

// Maps snake_case form field to Prisma column field.
function fieldToPrisma(field: string): string {
  switch (field) {
    case "kode_barang":
      return "kodeBarang";
    case "no_register":
      return "noRegister";
    case "nama_barang":
      return "namaBarang";
    case "merk_barang":
      return "merkBarang";
    case "no_sertifikat":
      return "noSertifikat";
    case "bahan":
      return "bahan";
    case "tahun_perolehan":
      return "tahunPerolehan";
    case "ukuran_barang":
      return "ukuranBarang";
    case "jumlah_barang":
      return "jumlahBarang";
    case "harga_barang":
      return "hargaBarang";
    default:
      return field;
  }
}
