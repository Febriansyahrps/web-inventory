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

  // ---- Field validation ----
  const missing: string[] = [];
  const idKategoriBarang = get("id_kategori_barang");
  const idLokasiBarang = get("id_lokasi_barang");
  const idAsalBarang = get("id_asal_barang");
  const idKeadaanBarang = get("id_keadaan_barang");
  const idSatuanBarang = get("id_satuan_barang");
  const kodeBarang = get("kode_barang");
  const noRegister = get("no_register");
  const namaBarang = get("nama_barang");
  const jumlahBarang = get("jumlah_barang");
  const hargaBarang = get("harga_barang");

  if (!idKategoriBarang) missing.push("id_kategori_barang");
  if (!idAsalBarang) missing.push("id_asal_barang");
  if (!idKeadaanBarang) missing.push("id_keadaan_barang");
  if (!idSatuanBarang) missing.push("id_satuan_barang");
  if (!kodeBarang) missing.push("kode_barang");
  if (!noRegister) missing.push("no_register");
  if (!namaBarang) missing.push("nama_barang");
  if (!jumlahBarang) missing.push("jumlah_barang");
  if (!hargaBarang) missing.push("harga_barang");

  if (missing.length > 0) {
    return NextResponse.json(
      { message: `Field wajib belum diisi: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const idKat = Number(idKategoriBarang);
  const idAsal = Number(idAsalBarang);
  const idKead = Number(idKeadaanBarang);
  const idSatu = Number(idSatuanBarang);
  const jumlah = Number(jumlahBarang);
  const harga = Number(hargaBarang);

  // id_lokasi_barang is optional: absent/empty means "no location".
  const lokasiRaw = idLokasiBarang?.trim() ?? "";
  let idLokasi: number | null = null;
  if (lokasiRaw !== "") {
    idLokasi = Number(lokasiRaw);
    if (!Number.isInteger(idLokasi) || idLokasi <= 0) {
      return NextResponse.json(
        { message: "id_lokasi_barang harus berupa bilangan bulat" },
        { status: 400 }
      );
    }
  }

  if (!Number.isInteger(idKat) || !Number.isInteger(idAsal) || !Number.isInteger(idKead) || !Number.isInteger(idSatu)) {
    return NextResponse.json(
      { message: "id_kategori_barang, id_asal_barang, id_keadaan_barang, id_satuan_barang harus berupa bilangan bulat" },
      { status: 400 }
    );
  }
  if (!Number.isInteger(jumlah) || jumlah < 0) {
    return NextResponse.json({ message: "jumlah_barang harus berupa bilangan bulat non-negatif" }, { status: 400 });
  }
  if (Number.isNaN(harga) || harga < 0) {
    return NextResponse.json({ message: "harga_barang harus berupa angka non-negatif" }, { status: 400 });
  }

  // FK existence checks
  const [katRow, lokasiRow, asalRow, keadRow, satuRow] = await Promise.all([
    prisma.kategoriBarang.findUnique({ where: { id: idKat } }),
    idLokasi ? prisma.lokasiBarang.findUnique({ where: { id: idLokasi } }) : null,
    prisma.asalBarang.findUnique({ where: { id: idAsal } }),
    prisma.keadaanBarang.findUnique({ where: { id: idKead } }),
    prisma.satuanBarang.findUnique({ where: { id: idSatu } }),
  ]);
  if (!katRow || (idLokasi && !lokasiRow) || !asalRow || !keadRow || !satuRow) {
    const bad: string[] = [];
    if (!katRow) bad.push("id_kategori_barang");
    if (idLokasi && !lokasiRow) bad.push("id_lokasi_barang");
    if (!asalRow) bad.push("id_asal_barang");
    if (!keadRow) bad.push("id_keadaan_barang");
    if (!satuRow) bad.push("id_satuan_barang");
    return NextResponse.json(
      { message: `Data referensi tidak ditemukan untuk: ${bad.join(", ")}` },
      { status: 400 }
    );
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

  const barang = await prisma.barang.create({
    data: {
      idUser: decoded.userId,
      idKategoriBarang: idKat,
      idLokasiBarang: idLokasi,
      idAsalBarang: idAsal,
      idKeadaanBarang: idKead,
      idSatuanBarang: idSatu,
      kodeBarang: kodeBarang!,
      noRegister: noRegister!,
      namaBarang: namaBarang!,
      merkBarang: optional(get("merk_barang")),
      noSertifikat: optional(get("no_sertifikat")),
      bahan: optional(get("bahan")),
      tahunPerolehan: (() => {
        const v = get("tahun_perolehan");
        const n = Number(v);
        return v && !Number.isNaN(n) ? n : null;
      })(),
      ukuranBarang: optional(get("ukuran_barang")),
      jumlahBarang: jumlah,
      hargaBarang: harga,
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
