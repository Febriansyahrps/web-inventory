import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ iduser: string }> }
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

  const { iduser } = await params;
  const id = Number(iduser);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
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
        { message: "username must be a non-empty string" },
        { status: 400 }
      );
    }
    const unameTaken = await prisma.user.findUnique({
      where: { username: username as string },
    });
    if (unameTaken && unameTaken.id !== id) {
      return NextResponse.json({ message: "Username already exists" }, { status: 400 });
    }
    data.username = username as string;
  }

  // fullname provided (non-empty) → update
  if (fullname !== undefined) {
    if (typeof fullname !== "string" || fullname.trim() === "") {
      return NextResponse.json(
        { message: "fullname must be a non-empty string" },
        { status: 400 }
      );
    }
    data.fullname = fullname as string;
  }

  // password provided → repeat_password required and must match
  if (password !== undefined) {
    if (typeof password !== "string" || password === "") {
      return NextResponse.json(
        { message: "password must be a non-empty string" },
        { status: 400 }
      );
    }
    if (typeof repeat_password !== "string" || repeat_password === "") {
      return NextResponse.json(
        { message: "repeat_password is required when password is provided" },
        { status: 400 }
      );
    }
    if (password !== repeat_password) {
      return NextResponse.json(
        { message: "Password and repeat_password do not match" },
        { status: 400 }
      );
    }
    data.password = await bcrypt.hash(password, 10);
  } else if (repeat_password !== undefined) {
    return NextResponse.json(
      { message: "repeat_password provided without password" },
      { status: 400 }
    );
  }

  // role provided → validate existence
  if (role !== undefined) {
    if (typeof role !== "number" && typeof role !== "string") {
      return NextResponse.json({ message: "role must be an integer" }, { status: 400 });
    }
    const roleId = Number(role);
    if (!Number.isInteger(roleId)) {
      return NextResponse.json({ message: "role must be an integer" }, { status: 400 });
    }
    const roleRow = await prisma.role.findUnique({ where: { id: roleId } });
    if (!roleRow) {
      return NextResponse.json({ message: "Role not found" }, { status: 400 });
    }
    data.idRole = roleId;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { message: "No fields to update" },
      { status: 400 }
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
    label: typeof data.username === "string" ? data.username : existing.username,
  });

  return NextResponse.json({ message: "User updated successfully" });
}
