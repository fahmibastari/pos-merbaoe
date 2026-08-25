import { getSession, type SessionPayload } from "./auth";

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
 * Memastikan ada sesi yang sah. Dipakai aksi yang boleh dijalankan kedua peran,
 * misalnya `submitSale`.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
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
  const session = await getSession();
  if (!session) {
    throw new AuthorizationError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }
  if (session.role !== "admin") {
    throw new AuthorizationError("Anda tidak memiliki akses untuk tindakan ini.");
  }
  return session;
}
