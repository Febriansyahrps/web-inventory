import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all page routes, excluding:
     * - /api/* (API routes)
     * - /_next/* (Next.js internals)
     * - static files (favicon, images, etc.)
     * - robots.txt / sitemap.xml (must stay public for crawlers)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

// Pages only reachable by ADMIN — mirrors the Sidebar, which hides these items
// from non-admins. "/akun" itself is open to every role (non-admins see their
// own account form); its sub-routes (/akun/tambah, /akun/[id]) stay admin-only.
const ADMIN_ONLY_PREFIXES = ["/riwayat", "/backup"];

function base64UrlDecode(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Edge-compatible JWT check (HS256). Middleware runs on the Edge runtime where
// lib/auth.ts (jsonwebtoken -> Node crypto) is unavailable, so signature and
// expiry are verified here with Web Crypto using the same JWT_SECRET. Returns
// the token payload (for role checks) or null when invalid.
async function verifyToken(
  authHeader: string | null
): Promise<{ role: string } | null> {
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expectedSignature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${headerB64}.${payloadB64}`))
  );
  const providedSignature = base64UrlDecode(signatureB64);

  if (expectedSignature.length !== providedSignature.length) return null;
  let diff = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    diff |= expectedSignature[i] ^ providedSignature[i];
  }
  if (diff !== 0) return null;

  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlDecode(payloadB64))
  ) as { exp?: number; role?: string };
  if (typeof payload.exp !== "number") return null;
  if (payload.exp * 1000 <= Date.now()) return null;

  return { role: payload.role ?? "" };
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value ?? null;
  const isLoginPage = request.nextUrl.pathname === "/login";

  const payload = token ? await verifyToken(`Bearer ${token}`) : null;
  const isValid = payload !== null;

  if (!isValid && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isValid && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin-only pages: send non-admins back to the dashboard.
  if (payload && payload.role !== "ADMIN") {
    const pathname = request.nextUrl.pathname;
    const isAdminOnly =
      ADMIN_ONLY_PREFIXES.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      ) || pathname.startsWith("/akun/");
    if (isAdminOnly) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}
