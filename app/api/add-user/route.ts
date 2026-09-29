import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  let decoded;
  try {
    decoded = verifyToken(req.headers.get("Authorization"));
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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

  const missing: string[] = [];
  if (typeof username !== "string" || username.trim() === "") missing.push("username");
  if (typeof password !== "string" || password === "") missing.push("password");
  if (typeof repeat_password !== "string" || repeat_password === "")
    missing.push("repeat_password");
  if (typeof role !== "number" && typeof role !== "string")
    missing.push("role");
  else if (typeof role === "string" && role.trim() === "") missing.push("role");
  if (typeof fullname !== "string" || fullname.trim() === "") missing.push("fullname");
  if (missing.length > 0) {
    return NextResponse.json(
      { message: `Missing required field(s): ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const uname: string = username as string;
  const pass: string = password as string;
  const repeat: string = repeat_password as string;
  const fname: string = fullname as string;

  if (pass !== repeat) {
    return NextResponse.json(
      { message: "Password and repeat_password do not match" },
      { status: 400 }
    );
  }

  const roleId = Number(role);
  if (!Number.isInteger(roleId)) {
    return NextResponse.json({ message: "role must be an integer" }, { status: 400 });
  }

  const roleRow = await prisma.role.findUnique({ where: { id: roleId } });
  if (!roleRow) {
    return NextResponse.json({ message: "Role not found" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username: uname } });
  if (existing) {
    return NextResponse.json({ message: "Username already exists" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(pass, 10);
  const user = await prisma.user.create({
    data: {
      username: uname,
      password: hashed,
      idRole: roleId,
      fullname: fname,
    },
    select: {
      id: true,
      username: true,
      role: { select: { id: true, name: true } },
    },
  });

  await logActivity({
    userId: decoded.userId,
    action: "CREATE",
    entity: "USER",
    entityId: user.id,
    label: user.username,
  });

  return NextResponse.json({
    message: "User created successfully",
    data: user,
  });
}
