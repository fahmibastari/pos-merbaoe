import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});
const prisma = new PrismaClient({ adapter });

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

  // ─── 2. Ingredients ─────────────────────────────────────────────────────────
  const kopiArabia = await prisma.ingredient.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Kopi Arabica", unit: "gram", currentStock: 2000, minimumStock: 500 },
  });

  const susu = await prisma.ingredient.upsert({
    where: { id: 2 },
    update: {},
    create: { name: "Susu Full Cream", unit: "ml", currentStock: 5000, minimumStock: 1000 },
  });

  const gulaPasir = await prisma.ingredient.upsert({
    where: { id: 3 },
    update: {},
    create: { name: "Gula Pasir", unit: "gram", currentStock: 3000, minimumStock: 500 },
  });

  const sirupAren = await prisma.ingredient.upsert({
    where: { id: 4 },
    update: {},
    create: { name: "Sirup Gula Aren", unit: "ml", currentStock: 2000, minimumStock: 300 },
  });

  const es = await prisma.ingredient.upsert({
    where: { id: 5 },
    update: {},
    create: { name: "Es Batu", unit: "gram", currentStock: 10000, minimumStock: 2000 },
  });

  const kopiRobusta = await prisma.ingredient.upsert({
    where: { id: 6 },
    update: {},
    create: { name: "Kopi Robusta", unit: "gram", currentStock: 2000, minimumStock: 500 },
  });

  const coklat = await prisma.ingredient.upsert({
    where: { id: 7 },
    update: {},
    create: { name: "Bubuk Coklat", unit: "gram", currentStock: 1000, minimumStock: 200 },
  });

  console.log("✅ Ingredients: 7 bahan baku tersimpan");

  // ─── 3. Products ────────────────────────────────────────────────────────────
  const kopiSusuAren = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Kopi Susu Aren",
      sellingPrice: 22000,
      baseHpp: 8500,
      hasRecipe: true,
      isActive: true,
    },
  });

  const americano = await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Americano",
      sellingPrice: 18000,
      baseHpp: 5000,
      hasRecipe: true,
      isActive: true,
    },
  });

  const matchaLatte = await prisma.product.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: "Matcha Latte",
      sellingPrice: 25000,
      baseHpp: 10000,
      hasRecipe: false,
      isActive: true,
    },
  });

  const coklatPanas = await prisma.product.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: "Coklat Panas",
      sellingPrice: 20000,
      baseHpp: 7000,
      hasRecipe: true,
      isActive: true,
    },
  });

  const esKopiSusu = await prisma.product.upsert({
    where: { id: 5 },
    update: {},
    create: {
      name: "Es Kopi Susu",
      sellingPrice: 20000,
      baseHpp: 7500,
      hasRecipe: true,
      isActive: true,
    },
  });

  console.log("✅ Products: 5 menu tersimpan");

  // ─── 4. Recipes (BOM) ───────────────────────────────────────────────────────
  // Kopi Susu Aren: 18g kopi arabica + 150ml susu + 30ml sirup aren + 150g es
  await prisma.recipe.deleteMany({ where: { productId: kopiSusuAren.id } });
  await prisma.recipe.createMany({
    data: [
      { productId: kopiSusuAren.id, ingredientId: kopiArabia.id, quantityNeeded: 18 },
      { productId: kopiSusuAren.id, ingredientId: susu.id, quantityNeeded: 150 },
      { productId: kopiSusuAren.id, ingredientId: sirupAren.id, quantityNeeded: 30 },
      { productId: kopiSusuAren.id, ingredientId: es.id, quantityNeeded: 150 },
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
