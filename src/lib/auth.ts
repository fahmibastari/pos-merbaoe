import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// README §8.1 — JWT_SECRET wajib ada dan tidak boleh punya nilai cadangan.
// Nilai cadangan yang tertulis di source code membuat siapa pun yang membaca
// repositori dapat menempa sesi administrator. Lebih baik gagal keras saat
// start daripada berjalan dengan keamanan semu.
function readJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET tidak diset atau kurang dari 32 karakter. " +
        "Bangkitkan dengan `openssl rand -base64 32`, lalu isikan ke .env " +
        "dan ke environment variable Vercel. Lihat README §8.1 dan §10.2."
    );
  }
  return new TextEncoder().encode(secret);
}

const SECRET_KEY = readJwtSecret();

export type SessionPayload = {
  userId: number;
  username: string;
  role: "admin" | "kasir";
  sessionVersion: number;
};

export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET_KEY);
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (
      !Number.isSafeInteger(payload.userId) ||
      typeof payload.username !== "string" ||
      (payload.role !== "admin" && payload.role !== "kasir") ||
      !Number.isSafeInteger(payload.sessionVersion) ||
      Number(payload.sessionVersion) < 1
    ) {
      return null;
    }
    return {
      userId: Number(payload.userId),
      username: payload.username,
      role: payload.role,
      sessionVersion: Number(payload.sessionVersion),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionPayload | null> {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}
