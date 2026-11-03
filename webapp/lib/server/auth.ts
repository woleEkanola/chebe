import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE = "chebe_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set (see .env.example)");
  return new TextEncoder().encode(s);
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = payload.sub as string;
    if (!userId) return null;
    return db.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}

/** Verifies a Bearer token for non-browser clients (C# service, mobile). */
export async function getBearerUser(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(h.slice(7), secret());
    const userId = payload.sub as string;
    if (!userId) return null;
    return db.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}

export async function requireUser(req?: Request) {
  const fromCookie = await getSessionUser();
  if (fromCookie) return fromCookie;
  if (req) {
    const fromBearer = await getBearerUser(req);
    if (fromBearer) return fromBearer;
  }
  return null;
}
