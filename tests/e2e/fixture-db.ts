import { prisma } from "../../src/lib/prisma";
import {
  E2E_CATEGORY_SLUG,
  E2E_PREFIX,
} from "./constants";

export async function cleanupE2EFixtures() {
  const [users, ingredients, products, categories] = await Promise.all([
    prisma.user.findMany({
      where: { username: { startsWith: E2E_PREFIX } },
      select: { id: true },
    }),
    prisma.ingredient.findMany({
      where: { name: { startsWith: "E2E Merbaoe" } },
      select: { id: true },
    }),
    prisma.product.findMany({
      where: { name: { startsWith: "E2E Merbaoe" } },
      select: { id: true },
    }),
    prisma.productCategory.findMany({
      where: { slug: { startsWith: E2E_CATEGORY_SLUG } },
      select: { id: true },
    }),
  ]);
  const userIds = users.map((row) => row.id);
  const ingredientIds = ingredients.map((row) => row.id);
  const productIds = products.map((row) => row.id);
  const categoryIds = categories.map((row) => row.id);

  await prisma.$transaction(async (tx) => {
    await tx.operationalExpense.deleteMany({
      where: { createdBy: { in: userIds } },
    });
    await tx.stockTransaction.deleteMany({
      where: {
        OR: [
          { createdBy: { in: userIds } },
          { ingredientId: { in: ingredientIds } },
        ],
      },
    });
    await tx.sale.deleteMany({ where: { cashierId: { in: userIds } } });
    await tx.cashierShift.deleteMany({ where: { cashierId: { in: userIds } } });
    await tx.product.deleteMany({ where: { id: { in: productIds } } });
    await tx.purchase.deleteMany({ where: { createdBy: { in: userIds } } });
    await tx.ingredient.deleteMany({ where: { id: { in: ingredientIds } } });
    await tx.productCategory.deleteMany({ where: { id: { in: categoryIds } } });
    await tx.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await tx.loginAttempt.deleteMany({
      where: { username: { startsWith: E2E_PREFIX } },
    });
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });
}
