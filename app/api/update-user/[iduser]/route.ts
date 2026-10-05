import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ iduser: string }> },
) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json(
      { message: "Tidak terautentikasi" },
      { status: 401 },
    );
  }

  const isAdmin = decoded.role === "ADMIN";

  const { iduser } = await params;
  const id = Number(iduser);
  if (!Number.isInteger(id)) {
    return NextResponse.json(
      { message: "Id pengguna tidak valid" },
      { status: 400 },
    );
  }

  if (!isAdmin && decoded.userId !== id) {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { message: "Pengguna tidak ditemukan" },
      { status: 404 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Body request tidak valid" },
      { status: 400 },
    );
  }

  const username = body.username;
  const password = body.password;
  const repeat_password = body.repeat_password;
  const role = body.role;
  const fullname = body.fullname;

  const data: {
    username?: string;
    password?: string;
    idRole?: number;
    fullname?: string;
  } = {};

  // username provided (non-empty) → validate uniqueness
  if (username !== undefined) {
    if (typeof username !== "string" || username.trim() === "") {
      return NextResponse.json(
        { message: "username harus diisi " },
        { status: 400 },
      );
    }
    const unameTaken = await prisma.user.findUnique({
      where: { username: username as string },
    });
    if (unameTaken && unameTaken.id !== id) {
      return NextResponse.json(
        { message: "Username sudah digunakan" },
        { status: 400 },
      );
    }
    data.username = username as string;
  }

  // fullname provided (non-empty) → update
  if (fullname !== undefined) {
    if (typeof fullname !== "string" || fullname.trim() === "") {
      return NextResponse.json(
        { message: "fullname harus diisi" },
        { status: 400 },
      );
    }
    data.fullname = fullname as string;
  }

  // password provided → repeat_password required and must match
  if (password !== undefined) {
    if (typeof password !== "string" || password === "") {
      return NextResponse.json(
        { message: "password harus diisi" },
        { status: 400 },
      );
    }
    if (typeof repeat_password !== "string" || repeat_password === "") {
      return NextResponse.json(
        { message: "Ulangi password wajib diisi saat password terisi" },
        { status: 400 },
      );
    }
    if (password !== repeat_password) {
      return NextResponse.json(
        { message: "Password dan ulangi password tidak cocok" },
        { status: 400 },
      );
    }
    data.password = await bcrypt.hash(password, 10);
  } else if (repeat_password !== undefined) {
    return NextResponse.json(
      { message: "Ulangi password diisi tanpa password" },
      { status: 400 },
    );
  }

  // role provided → validate existence
  if (role !== undefined) {
    if (!isAdmin) {
      return NextResponse.json(
        { message: "Role hanya dapat diubah oleh admin" },
        { status: 403 },
      );
    }
    if (typeof role !== "number" && typeof role !== "string") {
      return NextResponse.json(
        { message: "role harus sesuai data" },
        { status: 400 },
      );
    }
    const roleId = Number(role);
    if (!Number.isInteger(roleId)) {
      return NextResponse.json(
        { message: "role harus sesuai data" },
        { status: 400 },
      );
    }
    const roleRow = await prisma.role.findUnique({ where: { id: roleId } });
    if (!roleRow) {
      return NextResponse.json(
        { message: "Role tidak ditemukan" },
        { status: 400 },
      );
    }
    data.idRole = roleId;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { message: "Tidak ada field untuk diperbarui" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id },
    data,
  });

  await logActivity({
    userId: decoded.userId,
    action: "UPDATE",
    entity: "USER",
    entityId: id,
    label:
      typeof data.username === "string" ? data.username : existing.username,
  });

  return NextResponse.json({ message: "Pengguna berhasil diperbarui" });
}
