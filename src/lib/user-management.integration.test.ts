import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import bcrypt from "bcryptjs";
import { ActionError } from "./action-result";
import { authenticateCredentials } from "./login-service";
import { LOGIN_WINDOW_MS } from "./login-security";
import { prisma } from "./prisma";
import {
  createCashierUser,
  resetUserPassword,
  setUserActive,
} from "./user-management";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

test(
  "TASK-036: akun kasir diaudit, password dapat direset, dan sesi dicabut lewat versi",
  { skip: !runDatabaseTests },
  async () => {
    const suffix = randomUUID().slice(0, 8);
    const actor = await prisma.user.create({
      data: {
        name: `USER Admin ${suffix}`,
        username: `user-admin-${suffix}`,
        passwordHash: await bcrypt.hash("administrator-test", 10),
        role: "admin",
      },
    });
    let cashierId: number | null = null;

    try {
      const cashier = await createCashierUser(actor.id, {
        name: `Kasir ${suffix}`,
        username: `user-kasir-${suffix}`,
        password: "password-awal",
      });
      cashierId = cashier.id;
      const beforeReset = await prisma.user.findUniqueOrThrow({
        where: { id: cashier.id },
        select: { passwordHash: true, sessionVersion: true },
      });
      assert.equal(await bcrypt.compare("password-awal", beforeReset.passwordHash), true);

      await resetUserPassword(actor.id, cashier.id, "password-baru");
      const afterReset = await prisma.user.findUniqueOrThrow({
        where: { id: cashier.id },
        select: { passwordHash: true, sessionVersion: true },
      });
      assert.equal(await bcrypt.compare("password-baru", afterReset.passwordHash), true);
      assert.equal(afterReset.sessionVersion, beforeReset.sessionVersion + 1);

      const auditRows = await prisma.auditLog.findMany({
        where: { entity: "user", entityId: cashier.id },
        orderBy: { id: "asc" },
        select: { action: true, beforeData: true, afterData: true },
      });
      assert.deepEqual(auditRows.map((row) => row.action), ["create", "update"]);
      assert.equal(JSON.stringify(auditRows).includes("passwordHash"), false);
      assert.equal(JSON.stringify(auditRows).includes("password-baru"), false);
    } finally {
      if (cashierId !== null) {
        await prisma.auditLog.deleteMany({
          where: { entity: "user", entityId: cashierId },
        });
        await prisma.loginAttempt.deleteMany({
          where: { username: `user-kasir-${suffix}` },
        });
        await prisma.user.deleteMany({ where: { id: cashierId } });
      }
      await prisma.user.deleteMany({ where: { id: actor.id } });
    }
  },
);

test(
  "TASK-036: lima kegagalan mengunci login dan akun nonaktif ditolak",
  { skip: !runDatabaseTests },
  async () => {
    const suffix = randomUUID().slice(0, 8);
    const username = `login-${suffix}`;
    const password = "password-benar";
    const actor = await prisma.user.create({
      data: {
        name: `LOGIN Admin ${suffix}`,
        username: `login-admin-${suffix}`,
        passwordHash: await bcrypt.hash("administrator-test", 10),
        role: "admin",
      },
    });
    const user = await prisma.user.create({
      data: {
        name: `LOGIN Cashier ${suffix}`,
        username,
        passwordHash: await bcrypt.hash(password, 10),
        role: "kasir",
      },
    });
    const startedAt = new Date();
    let shiftId: number | null = null;

    try {
      const failureTimes = [0, 500, 3_000, 8_500, 14_000];
      for (const offset of failureTimes) {
        await assert.rejects(
          authenticateCredentials(
            username,
            "password-salah",
            new Date(startedAt.getTime() + offset),
          ),
          ActionError,
        );
      }
      const attempt = await prisma.loginAttempt.findUniqueOrThrow({
        where: { username },
      });
      assert.equal(attempt.failedCount, 5);
      assert.equal(
        attempt.blockedUntil?.getTime(),
        startedAt.getTime() + LOGIN_WINDOW_MS,
      );

      await assert.rejects(
        authenticateCredentials(
          username,
          password,
          new Date(startedAt.getTime() + 15_000),
        ),
        (error) => error instanceof ActionError && /Terlalu banyak/.test(error.message),
      );

      const loggedIn = await authenticateCredentials(
        username,
        password,
        new Date(startedAt.getTime() + LOGIN_WINDOW_MS + 1_000),
      );
      assert.equal(loggedIn.userId, user.id);
      assert.equal(
        await prisma.loginAttempt.count({ where: { username } }),
        0,
      );

      const shift = await prisma.cashierShift.create({
        data: { cashierId: user.id, openingCash: 0 },
      });
      shiftId = shift.id;
      await assert.rejects(
        setUserActive(actor.id, user.id, false),
        (error) => error instanceof ActionError && /shift terbuka/.test(error.message),
      );
      await prisma.cashierShift.delete({ where: { id: shift.id } });
      shiftId = null;

      await setUserActive(actor.id, user.id, false);
      await assert.rejects(
        authenticateCredentials(username, password),
        (error) => error instanceof ActionError && /Username atau password/.test(error.message),
      );
    } finally {
      await prisma.loginAttempt.deleteMany({ where: { username } });
      if (shiftId !== null) {
        await prisma.cashierShift.deleteMany({ where: { id: shiftId } });
      }
      await prisma.auditLog.deleteMany({
        where: { entity: "user", entityId: user.id },
      });
      await prisma.user.deleteMany({ where: { id: user.id } });
      await prisma.user.deleteMany({ where: { id: actor.id } });
    }
  },
);
