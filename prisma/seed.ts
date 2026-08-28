import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";
import { applyStockIn } from "../src/lib/costing";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});
const prisma = new PrismaClient({ adapter });

const ingredientSeeds = [
  {
    id: 1,
    name: "Kopi Arabica",
    unit: "gram",
    minimumStock: 500,
    openingQuantity: 1_000,
    openingUnitCost: 150,
  },
  {
    id: 2,
    name: "Susu Full Cream",
    unit: "ml",
    minimumStock: 1_000,
    openingQuantity: 2_000,
    openingUnitCost: 20,
  },
  {
    id: 3,
    name: "Gula Pasir",
    unit: "gram",
    minimumStock: 500,
    openingQuantity: 3_000,
    openingUnitCost: 18,
  },
  {
    id: 4,
    name: "Sirup Gula Aren",
    unit: "ml",
    minimumStock: 300,
    openingQuantity: 500,
    openingUnitCost: 30,
  },
  {
    id: 5,
    name: "Es Batu",
    unit: "gram",
    minimumStock: 2_000,
    openingQuantity: 10_000,
    openingUnitCost: 1,
  },
  {
    id: 6,
    name: "Kopi Robusta",
    unit: "gram",
    minimumStock: 500,
    openingQuantity: 2_000,
    openingUnitCost: 100,
  },
  {
    id: 7,
    name: "Bubuk Coklat",
    unit: "gram",
    minimumStock: 200,
    openingQuantity: 1_000,
    openingUnitCost: 80,
  },
] as const;

async function main() {
  console.log("🌱 Seeding database Merbaoe POS...");

  // ─── 1. Users ───────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const kasirPassword = await bcrypt.hash("kasir123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Owner Merbaoe",
      username: "admin",
      passwordHash: adminPassword,
      role: "admin",
    },
  });

  const kasir = await prisma.user.upsert({
    where: { username: "kasir" },
    update: {},
    create: {
      name: "Kasir Merbaoe",
      username: "kasir",
      passwordHash: kasirPassword,
      role: "kasir",
    },
  });

  console.log(`✅ Users: ${admin.username} (admin), ${kasir.username} (kasir)`);

  // ─── 2. Ingredients + opening balances ─────────────────────────────────────
  // Saldo awal tidak boleh diisi langsung tanpa nilai. Setiap bahan dibentuk
  // dari keadaan nol melalui mutasi `opening` dalam transaksi yang sama.
  const ingredients = await prisma.$transaction(
    async (tx) => {
      const seeded = [];

      for (const item of ingredientSeeds) {
        seeded.push(
          await tx.ingredient.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              unit: item.unit,
              minimumStock: item.minimumStock,
              isActive: true,
            },
            create: {
              name: item.name,
              unit: item.unit,
              minimumStock: item.minimumStock,
              currentStock: 0,
              stockValue: 0,
              averageCost: 0,
              isActive: true,
            },
          })
        );
      }

      const ingredientIds = seeded.map((ingredient) => ingredient.id);
      const movements = await tx.stockTransaction.findMany({
        where: { ingredientId: { in: ingredientIds } },
        select: { ingredientId: true, source: true },
      });
      const movementsByIngredient = new Map<number, Set<string>>();
      for (const movement of movements) {
        const sources = movementsByIngredient.get(movement.ingredientId) ?? new Set();
        sources.add(movement.source);
        movementsByIngredient.set(movement.ingredientId, sources);
      }

      let openingCreated = 0;
      for (const item of ingredientSeeds) {
        const sources = movementsByIngredient.get(item.id);
        if (sources?.has("opening")) continue;
        if (sources && sources.size > 0) {
          throw new Error(
            `Tidak dapat membuat saldo opening ${item.name}: mutasi stok lain sudah ada.`
          );
        }

        const opening = applyStockIn(
          { currentStock: 0, stockValue: 0, averageCost: 0 },
          item.openingQuantity,
          item.openingUnitCost
        );
        await tx.ingredient.update({
          where: { id: item.id },
          data: opening,
        });
        await tx.stockTransaction.create({
          data: {
            ingredientId: item.id,
            type: "in",
            quantity: item.openingQuantity,
            unitCost: item.openingUnitCost,
            totalCost: opening.stockValue,
            balanceAfter: opening.currentStock,
            valueAfter: opening.stockValue,
            source: "opening",
            notes: "Saldo pembukaan seed",
            createdBy: admin.id,
          },
        });
        openingCreated += 1;
      }

      return { seeded, openingCreated };
    },
    { timeout: 30_000 }
  );

  const ingredientsById = new Map(
    ingredients.seeded.map((ingredient) => [ingredient.id, ingredient])
  );
  const kopiArabia = ingredientsById.get(1)!;
  const susu = ingredientsById.get(2)!;
  const gulaPasir = ingredientsById.get(3)!;
  const sirupAren = ingredientsById.get(4)!;
  const es = ingredientsById.get(5)!;
  const kopiRobusta = ingredientsById.get(6)!;
  const coklat = ingredientsById.get(7)!;

  console.log(
    `✅ Ingredients: 7 bahan baku, ${ingredients.openingCreated} saldo opening baru`
  );

  // ─── 3. Product categories & products ───────────────────────────────────────
  const kopiCategory = await prisma.productCategory.upsert({
    where: { slug: "kopi" },
    update: { name: "Kopi", sortOrder: 10, isActive: true },
    create: { name: "Kopi", slug: "kopi", sortOrder: 10, isActive: true },
  });
  const nonKopiCategory = await prisma.productCategory.upsert({
    where: { slug: "non-kopi" },
    update: { name: "Non Kopi", sortOrder: 20, isActive: true },
    create: { name: "Non Kopi", slug: "non-kopi", sortOrder: 20, isActive: true },
  });

  const kopiSusuAren = await prisma.product.upsert({
    where: { id: 1 },
    update: {
      name: "Kopi Susu Aren",
      sellingPrice: 18000,
      baseHpp: 5250,
      categoryId: kopiCategory.id,
      hasRecipe: true,
      isActive: true,
    },
    create: {
      name: "Kopi Susu Aren",
      sellingPrice: 18000,
      baseHpp: 5250,
      categoryId: kopiCategory.id,
      hasRecipe: true,
      isActive: true,
    },
  });

  const americano = await prisma.product.upsert({
    where: { id: 2 },
    update: {
      name: "Americano",
      sellingPrice: 18000,
      baseHpp: 5000,
      categoryId: kopiCategory.id,
      hasRecipe: true,
      isActive: true,
    },
    create: {
      name: "Americano",
      sellingPrice: 18000,
      baseHpp: 5000,
      categoryId: kopiCategory.id,
      hasRecipe: true,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { id: 3 },
    update: {
      name: "Matcha Latte",
      sellingPrice: 25000,
      baseHpp: 10000,
      categoryId: nonKopiCategory.id,
      hasRecipe: false,
      isActive: true,
    },
    create: {
      name: "Matcha Latte",
      sellingPrice: 25000,
      baseHpp: 10000,
      categoryId: nonKopiCategory.id,
      hasRecipe: false,
      isActive: true,
    },
  });

  const coklatPanas = await prisma.product.upsert({
    where: { id: 4 },
    update: {
      name: "Coklat Panas",
      sellingPrice: 20000,
      baseHpp: 7000,
      categoryId: nonKopiCategory.id,
      hasRecipe: true,
      isActive: true,
    },
    create: {
      name: "Coklat Panas",
      sellingPrice: 20000,
      baseHpp: 7000,
      categoryId: nonKopiCategory.id,
      hasRecipe: true,
      isActive: true,
    },
  });

  const esKopiSusu = await prisma.product.upsert({
    where: { id: 5 },
    update: {
      name: "Es Kopi Susu",
      sellingPrice: 20000,
      baseHpp: 7500,
      categoryId: kopiCategory.id,
      hasRecipe: true,
      isActive: true,
    },
    create: {
      name: "Es Kopi Susu",
      sellingPrice: 20000,
      baseHpp: 7500,
      categoryId: kopiCategory.id,
      hasRecipe: true,
      isActive: true,
    },
  });

  console.log("✅ Product categories: Kopi dan Non Kopi; 5 menu tersimpan");

  // ─── 4. Recipes (BOM) ───────────────────────────────────────────────────────
  // Simulasi README §3.10.B: 15g kopi + 120ml susu + 20ml gula aren.
  await prisma.recipe.deleteMany({ where: { productId: kopiSusuAren.id } });
  await prisma.recipe.createMany({
    data: [
      { productId: kopiSusuAren.id, ingredientId: kopiArabia.id, quantityNeeded: 15 },
      { productId: kopiSusuAren.id, ingredientId: susu.id, quantityNeeded: 120 },
      { productId: kopiSusuAren.id, ingredientId: sirupAren.id, quantityNeeded: 20 },
    ],
  });

  // Americano: 20g kopi arabica + 200ml air (air tidak ditrack)
  await prisma.recipe.deleteMany({ where: { productId: americano.id } });
  await prisma.recipe.createMany({
    data: [
      { productId: americano.id, ingredientId: kopiArabia.id, quantityNeeded: 20 },
    ],
  });

  // Coklat Panas: 30g bubuk coklat + 200ml susu + 15g gula
  await prisma.recipe.deleteMany({ where: { productId: coklatPanas.id } });
  await prisma.recipe.createMany({
    data: [
      { productId: coklatPanas.id, ingredientId: coklat.id, quantityNeeded: 30 },
      { productId: coklatPanas.id, ingredientId: susu.id, quantityNeeded: 200 },
      { productId: coklatPanas.id, ingredientId: gulaPasir.id, quantityNeeded: 15 },
    ],
  });

  // Es Kopi Susu: 18g kopi robusta + 150ml susu + 20g gula + 200g es
  await prisma.recipe.deleteMany({ where: { productId: esKopiSusu.id } });
  await prisma.recipe.createMany({
    data: [
      { productId: esKopiSusu.id, ingredientId: kopiRobusta.id, quantityNeeded: 18 },
      { productId: esKopiSusu.id, ingredientId: susu.id, quantityNeeded: 150 },
      { productId: esKopiSusu.id, ingredientId: gulaPasir.id, quantityNeeded: 20 },
      { productId: esKopiSusu.id, ingredientId: es.id, quantityNeeded: 200 },
    ],
  });

  console.log("✅ Recipes: BOM 4 produk tersimpan");
  console.log("");
  console.log("🎉 Seeding selesai! Akun login:");
  console.log("   Admin  → username: admin   | password: admin123");
  console.log("   Kasir  → username: kasir   | password: kasir123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
