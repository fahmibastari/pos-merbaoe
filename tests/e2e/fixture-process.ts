import "dotenv/config";
import { mkdir, rm, writeFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { createSession } from "../../src/lib/auth";
import { prisma } from "../../src/lib/prisma";
import {
  E2E_ADMIN_STATE,
  E2E_ADMIN_USERNAME,
  E2E_CASHIER_STATE,
  E2E_CASHIER_USERNAME,
  E2E_CATEGORY_NAME,
  E2E_CATEGORY_SLUG,
  E2E_INGREDIENT_NAME,
  E2E_PASSWORD,
  E2E_PRODUCT_NAME,
  E2E_STATE_DIR,
} from "./constants";
import { cleanupE2EFixtures } from "./fixture-db";

function storageState(baseURL: string, token: string) {
  const url = new URL(baseURL);
  return {
    cookies: [
      {
        name: "session",
        value: token,
        domain: url.hostname,
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: url.protocol === "https:",
        sameSite: "Lax" as const,
      },
    ],
    origins: [],
  };
}

async function setup(baseURL: string) {
  await cleanupE2EFixtures();
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);
  const [admin, cashier] = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: "E2E Administrator",
        username: E2E_ADMIN_USERNAME,
        passwordHash,
        role: "admin",
      },
    }),
    prisma.user.create({
      data: {
        name: "E2E Kasir",
        username: E2E_CASHIER_USERNAME,
        passwordHash,
        role: "kasir",
      },
    }),
  ]);
  const category = await prisma.productCategory.create({
    data: { name: E2E_CATEGORY_NAME, slug: E2E_CATEGORY_SLUG, sortOrder: 999 },
  });
  const ingredient = await prisma.ingredient.create({
    data: {
      name: E2E_INGREDIENT_NAME,
      unit: "gram",
      currentStock: 100,
      stockValue: 1_000,
      averageCost: 10,
      minimumStock: 0,
    },
  });
  await prisma.product.create({
    data: {
      name: E2E_PRODUCT_NAME,
      categoryId: category.id,
      sellingPrice: 18_000,
      baseHpp: 20,
      hasRecipe: true,
      recipes: {
        create: { ingredientId: ingredient.id, quantityNeeded: 2 },
      },
    },
  });
  await prisma.product.createMany({
    data: Array.from({ length: 11 }, (_, index) => ({
      name: `E2E Merbaoe Menu ${String(index + 1).padStart(2, "0")}`,
      categoryId: category.id,
      sellingPrice: 12_000 + index * 1_000,
      baseHpp: 4_000 + index * 250,
      hasRecipe: false,
    })),
  });
  await prisma.cashierShift.create({
    data: { cashierId: cashier.id, openingCash: 0 },
  });

  const [adminToken, cashierToken] = await Promise.all([
    createSession({
      userId: admin.id,
      username: admin.username,
      role: "admin",
      sessionVersion: admin.sessionVersion,
    }),
    createSession({
      userId: cashier.id,
      username: cashier.username,
      role: "kasir",
      sessionVersion: cashier.sessionVersion,
    }),
  ]);
  await mkdir(E2E_STATE_DIR, { recursive: true });
  await Promise.all([
    writeFile(
      E2E_ADMIN_STATE,
      JSON.stringify(storageState(baseURL, adminToken), null, 2),
    ),
    writeFile(
      E2E_CASHIER_STATE,
      JSON.stringify(storageState(baseURL, cashierToken), null, 2),
    ),
  ]);
}

async function teardown() {
  try {
    await cleanupE2EFixtures();
  } finally {
    await rm(E2E_STATE_DIR, { recursive: true, force: true });
  }
}

async function main() {
  const operation = process.argv[2];
  try {
    if (operation === "setup") {
      const baseURL = process.argv[3];
      if (!baseURL) throw new Error("Base URL E2E wajib tersedia.");
      await setup(baseURL);
    } else if (operation === "teardown") {
      await teardown();
    } else {
      throw new Error(`Operasi fixture E2E tidak dikenal: ${operation ?? "kosong"}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
