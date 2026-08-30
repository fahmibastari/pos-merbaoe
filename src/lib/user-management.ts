import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma";
import { ActionError } from "@/lib/action-result";
import { auditJson } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export type ManagedUserDTO = {
  id: number;
  name: string;
  username: string;
  role: "admin" | "kasir";
  isActive: boolean;
  hasOpenShift: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type CreateCashierInput = {
  name: string;
  username: string;
  password: string;
};

export async function getManagedUsers(): Promise<ManagedUserDTO[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      shifts: {
        where: { status: "open" },
        select: { id: true },
        take: 1,
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    hasOpenShift: user.shifts.length > 0,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function createCashierUser(
  actorId: number,
  input: CreateCashierInput,
): Promise<{ id: number; username: string }> {
  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        username: input.username,
        passwordHash,
        role: "kasir",
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "create",
        entity: "user",
        entityId: user.id,
        afterData: auditJson(user),
      },
    });
    return { id: user.id, username: user.username };
  });
}

export async function resetUserPassword(
  actorId: number,
  userId: number,
  password: string,
): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true },
    });
    if (!before) throw new ActionError("Pengguna tidak ditemukan.");

    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
    });
    await tx.loginAttempt.deleteMany({ where: { username: before.username } });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "update",
        entity: "user",
        entityId: userId,
        beforeData: auditJson({
          name: before.name,
          username: before.username,
          credentialReset: false,
        }),
        afterData: auditJson({
          name: before.name,
          username: before.username,
          credentialReset: true,
        }),
      },
    });
  });
}

export async function setUserActive(
  actorId: number,
  userId: number,
  isActive: boolean,
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          shifts: {
            where: { status: "open" },
            select: { id: true },
            take: 1,
          },
        },
      });
      if (!user) throw new ActionError("Pengguna tidak ditemukan.");
      if (user.isActive === isActive) return;

      if (!isActive && user.id === actorId) {
        throw new ActionError("Akun yang sedang dipakai tidak dapat dinonaktifkan.");
      }
      if (!isActive && user.shifts.length > 0) {
        throw new ActionError(
          "Pengguna masih memiliki shift terbuka. Tutup shift sebelum menonaktifkan akun.",
        );
      }
      if (!isActive && user.role === "admin") {
        const activeAdmins = await tx.user.count({
          where: { role: "admin", isActive: true },
        });
        if (activeAdmins <= 1) {
          throw new ActionError("Administrator aktif terakhir tidak dapat dinonaktifkan.");
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          isActive,
          sessionVersion: { increment: 1 },
        },
      });
      await tx.loginAttempt.deleteMany({ where: { username: user.username } });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: isActive ? "activate" : "deactivate",
          entity: "user",
          entityId: user.id,
          beforeData: auditJson({
            name: user.name,
            username: user.username,
            role: user.role,
            isActive: user.isActive,
          }),
          afterData: auditJson({
            name: user.name,
            username: user.username,
            role: user.role,
            isActive,
          }),
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
