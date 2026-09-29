import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { message: "Username and password are required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: true },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Invalid username or password" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json(
      { message: "Invalid username or password" },
      { status: 401 }
    );
  }

  const token = signToken({ userId: user.id, role: user.role.name });

  const {
    password: _password,
    role,
    createdAt,
    updatedAt,
    ...userData
  } = user;

  return NextResponse.json({
    message: "Login successful",
    token,
    user: {
      ...userData,
      role: { id: role.id, name: role.name },
      createdAt,
      updatedAt,
    },
  });
}
