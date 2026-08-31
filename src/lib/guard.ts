import { cache } from "react";
import { getSession, type SessionPayload } from "./auth";
import { prisma } from "./prisma";

/**
 * Lapisan otorisasi ketiga — README §4.3.
 *
 * Server Action dipanggil berdasarkan identitas aksi, bukan berdasarkan alamat
 * halaman. Karena itu proteksi rute (`proxy`/`middleware`) dan pemeriksaan di
 * layout TIDAK menjangkaunya: sebuah permintaan dari halaman mana pun dapat
 * memanggil aksi yang didefinisikan di modul admin.
 *
 * Lapisan ini adalah pengaman sesungguhnya. Setiap Server Action wajib
 * memanggil salah satu fungsi di bawah pada baris pertama.
 */

/** Galat otorisasi, dibedakan dari galat bisnis agar penanganannya berbeda. */
export class AuthorizationError extends Error {
  readonly kind = "authorization" as const;

  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function isAuthorizationError(e: unknown): e is AuthorizationError {
  return e instanceof AuthorizationError;
}

/**
 * Memeriksa payload sesi terhadap akun yang tersimpan. Fungsi terpisah ini
 * menjaga guard Server Action dapat diuji tanpa memalsukan request store Next.js.
 */
export async function resolveActiveSession(
  session: SessionPayload | null,
): Promise<SessionPayload | null> {
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      username: true,
      role: true,
      isActive: true,
      sessionVersion: true,
    },
  });
  if (
    !user?.isActive ||
    user.username !== session.username ||
    user.role !== session.role ||
    user.sessionVersion !== session.sessionVersion
  ) {
    return null;
  }
  return session;
}

/**
 * Verifikasi sesi terhadap keadaan akun terkini. Proxy tetap hanya memeriksa
 * tanda tangan JWT sebagai gerbang cepat; pemeriksaan basis data ini adalah
 * batas otorisasi sebenarnya dan sekaligus mencabut sesi lama setelah reset
 * password atau perubahan status akun.
 */
export const getActiveSession = cache(
  async (): Promise<SessionPayload | null> => {
    return resolveActiveSession(await getSession());
  },
);

export async function requireAdminSession(
  session: SessionPayload | null,
): Promise<SessionPayload> {
  const activeSession = await resolveActiveSession(session);
  if (!activeSession) {
    throw new AuthorizationError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }
  if (activeSession.role !== "admin") {
    throw new AuthorizationError("Anda tidak memiliki akses untuk tindakan ini.");
  }
  return activeSession;
}

/**
 * Memastikan ada sesi yang sah. Dipakai aksi yang boleh dijalankan kedua peran,
 * misalnya `submitSale`.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getActiveSession();
  if (!session) {
    throw new AuthorizationError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }
  return session;
}

/**
 * Memastikan sesi ada DAN berperan admin. Dipakai seluruh aksi pada modul admin.
 *
 * Pesan galat sengaja tidak membedakan "tidak ada sesi" dari "peran tidak
 * mencukupi" untuk peran non-admin, agar tidak membocorkan keberadaan aksi.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  return requireAdminSession(await getSession());
}
