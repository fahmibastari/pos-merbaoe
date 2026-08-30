import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma";
import { ActionError } from "@/lib/action-result";
import {
  isLoginAttemptBlocked,
  loginRetryAfterSeconds,
  LOGIN_WINDOW_MS,
  nextLoginAttemptState,
  normalizeLoginUsername,
  type LoginAttemptState,
} from "@/lib/login-security";
import { prisma } from "@/lib/prisma";

const DUMMY_PASSWORD_HASH =
  "$2b$10$mb1FtMF3AElSEmHQLWNhKegZhG5YqxPV1StT4ju6RpSL8t4IXWpwG";
const INVALID_CREDENTIALS = "Username atau password salah.";
const SERIALIZABLE_RETRIES = 3;

export type AuthenticatedUser = {
  userId: number;
  username: string;
  role: "admin" | "kasir";
  sessionVersion: number;
};

function isTransactionConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

async function withSerializableRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= SERIALIZABLE_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isTransactionConflict(error) || attempt === SERIALIZABLE_RETRIES) {
        throw error;
      }
    }
  }
  throw new Error("Percobaan transaksi login tidak selesai.");
}

function blockedMessage(attempt: LoginAttemptState, now: Date): string {
  const seconds = loginRetryAfterSeconds(attempt, now);
  if (seconds >= 60) {
    return `Terlalu banyak percobaan masuk. Coba lagi dalam ${Math.ceil(seconds / 60)} menit.`;
  }
  return `Terlalu banyak percobaan masuk. Coba lagi dalam ${Math.max(seconds, 1)} detik.`;
}

async function registerLoginFailure(
  username: string,
  now: Date,
): Promise<LoginAttemptState> {
  return withSerializableRetry(async (tx) => {
    const current = await tx.loginAttempt.findUnique({
      where: { username },
      select: {
        failedCount: true,
        windowStartedAt: true,
        blockedUntil: true,
      },
    });
    const next = nextLoginAttemptState(current, now);

    await tx.loginAttempt.upsert({
      where: { username },
      update: next,
      create: { username, ...next },
    });

    await tx.loginAttempt.deleteMany({
      where: {
        username: { not: username },
        updatedAt: { lt: new Date(now.getTime() - LOGIN_WINDOW_MS * 4) },
      },
    });

    return next;
  });
}

export async function authenticateCredentials(
  rawUsername: string,
  password: string,
  now = new Date(),
): Promise<AuthenticatedUser> {
  const username = normalizeLoginUsername(rawUsername);
  const [user, attempt] = await Promise.all([
    prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true,
        isActive: true,
        sessionVersion: true,
      },
    }),
    prisma.loginAttempt.findUnique({
      where: { username },
      select: {
        failedCount: true,
        windowStartedAt: true,
        blockedUntil: true,
      },
    }),
  ]);

  // Tetap lakukan bcrypt untuk username yang tidak terdaftar dan saat throttle
  // aktif. Dengan demikian keberadaan akun tidak bocor lewat jalur waktu cepat.
  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  const checkedAt = now;

  if (isLoginAttemptBlocked(attempt, checkedAt)) {
    throw new ActionError(blockedMessage(attempt!, checkedAt));
  }

  if (!user || !passwordMatches || !user.isActive) {
    const nextAttempt = await registerLoginFailure(username, now);
    if (isLoginAttemptBlocked(nextAttempt, now)) {
      throw new ActionError(blockedMessage(nextAttempt, now));
    }
    throw new ActionError(INVALID_CREDENTIALS);
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: user.id,
        isActive: true,
        sessionVersion: user.sessionVersion,
      },
      data: { lastLoginAt: now },
    });
    if (updated.count !== 1) throw new ActionError(INVALID_CREDENTIALS);
    await tx.loginAttempt.deleteMany({ where: { username } });
  });

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    sessionVersion: user.sessionVersion,
  };
}
