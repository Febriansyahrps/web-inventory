// lib/auth.ts
import jwt from "jsonwebtoken";

export function signToken(payload: { userId: number; role: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1d" });
}

export function verifyToken(authHeader: string | null) {
  if (!authHeader) throw new Error("No token provided");
  const token = authHeader.replace("Bearer ", "");
  return jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: number;
    role: string;
  };
}
