import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { serializeBarang, barangInclude } from "@/lib/serialize";
import { savePhoto } from "@/lib/upload";
import { logActivity } from "@/lib/activityLog";

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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Body multipart tidak valid" }, { status: 400 });
  }

  const get = (k: string): string | undefined => {
    const v = form.get(k);
    return typeof v === "string" ? v : undefined;
  };

  // ---- Field validation (only nama_barang is required) ----
  const namaBarang = get("nama_barang");
  if (namaBarang === undefined || namaBarang.trim() === "") {
    return NextResponse.json(
      { message: "Field wajib belum diisi: nama_barang" },
      { status: 400 }
    );
  }

  // FK fields are optional: absent/empty means "not set", otherwise a positive int.
  const fkFields: Record<string, string> = {
    id_kategori_barang: "idKategoriBarang",
    id_lokasi_barang: "idLokasiBarang",
    id_asal_barang: "idAsalBarang",
    id_keadaan_barang: "idKeadaanBarang",
    id_satuan_barang: "idSatuanBarang",
  };
  const fkValues: Record<string, number | null> = {};
  for (const apiField of Object.keys(fkFields)) {
    const raw = get(apiField);
    if (raw === undefined || raw.trim() === "") {
      fkValues[apiField] = null;
      continue;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
      return NextResponse.json(
        { message: `${apiField} harus berupa bilangan bulat positif` },
        { status: 400 }
      );
    }
    fkValues[apiField] = n;
  }

  // Referenced rows must exist when an FK was provided.
  const fkModels: Record<
    string,
    { findUnique: (a: { where: { id: number } }) => Promise<unknown> }
  > = {
    id_kategori_barang: prisma.kategoriBarang,
    id_lokasi_barang: prisma.lokasiBarang,
    id_asal_barang: prisma.asalBarang,
    id_keadaan_barang: prisma.keadaanBarang,
    id_satuan_barang: prisma.satuanBarang,
  };
  const missingRefs: string[] = [];
  for (const [apiField, model] of Object.entries(fkModels)) {
    const refId = fkValues[apiField];
    if (refId === null) continue;
    const row = await model.findUnique({ where: { id: refId } });
    if (!row) missingRefs.push(apiField);
  }
  if (missingRefs.length > 0) {
    return NextResponse.json(
      { message: `Data referensi tidak ditemukan untuk: ${missingRefs.join(", ")}` },
      { status: 400 }
    );
  }

  // Numeric fields are optional: absent/empty means null.
  const optionalNumber = (
    field: string,
    integer: boolean
  ): { value: number | null } | { error: string } => {
    const raw = get(field);
    if (raw === undefined || raw.trim() === "") return { value: null };
    const n = Number(raw);
    if (Number.isNaN(n) || n < 0 || (integer && !Number.isInteger(n))) {
      return {
        error: integer
          ? `${field} harus berupa bilangan bulat non-negatif`
          : `${field} harus berupa angka non-negatif`,
      };
    }
    return { value: n };
  };
  const jumlah = optionalNumber("jumlah_barang", true);
  if ("error" in jumlah) {
    return NextResponse.json({ message: jumlah.error }, { status: 400 });
  }
  const harga = optionalNumber("harga_barang", false);
  if ("error" in harga) {
    return NextResponse.json({ message: harga.error }, { status: 400 });
  }

  // ---- Photo upload (optional) ----
  let fotoPath: string | null = null;
  const fotoFile = form.get("foto");
  if (fotoFile instanceof File) {
    try {
      fotoPath = await savePhoto(fotoFile);
    } catch (e) {
      return NextResponse.json(
        { message: (e as Error).message },
        { status: 400 }
      );
    }
  }

  const optional = (v: string | undefined) => (v === undefined ? null : v);
  const optionalText = (v: string | undefined) =>
    v === undefined || v.trim() === "" ? null : v;

  const barang = await prisma.barang.create({
    data: {
      idUser: decoded.userId,
      idKategoriBarang: fkValues.id_kategori_barang,
      idLokasiBarang: fkValues.id_lokasi_barang,
      idAsalBarang: fkValues.id_asal_barang,
      idKeadaanBarang: fkValues.id_keadaan_barang,
      idSatuanBarang: fkValues.id_satuan_barang,
      kodeBarang: optionalText(get("kode_barang")),
      noRegister: optionalText(get("no_register")),
      namaBarang: namaBarang,
      merkBarang: optional(get("merk_barang")),
      noSertifikat: optional(get("no_sertifikat")),
      bahan: optional(get("bahan")),
      tahunPerolehan: (() => {
        const v = get("tahun_perolehan");
        const n = Number(v);
        return v && !Number.isNaN(n) ? n : null;
      })(),
      ukuranBarang: optional(get("ukuran_barang")),
      jumlahBarang: jumlah.value,
      hargaBarang: harga.value,
      fotoBarang: fotoPath,
    },
    include: barangInclude,
  });

  await logActivity({
    userId: decoded.userId,
    action: "CREATE",
    entity: "BARANG",
    entityId: barang.id,
    label: barang.namaBarang,
  });

  return NextResponse.json({
    message: "Barang berhasil dibuat",
    description: `Barang ${barang.namaBarang} telah dibuat.`,
    data: serializeBarang(barang),
  });
}
