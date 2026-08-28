import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@/generated/prisma";
import {
  toCashierProductDTO,
  toIngredientRowDTO,
  toProductRowDTO,
  toPurchaseIngredientDTO,
} from "@/lib/dto";

test("DTO server/client mempertahankan digit Decimal tanpa field Prisma mentah", () => {
  const cashierProduct = toCashierProductDTO(
    {
      id: 1,
      categoryId: 2,
      name: "Kopi Susu",
      sellingPrice: new Prisma.Decimal("18000.50"),
      hasRecipe: true,
      imagePath: "products/kopi.webp",
      category: { name: "Kopi" },
      recipes: [
        {
          quantityNeeded: new Prisma.Decimal("12.345"),
          ingredient: {
            id: 3,
            name: "Biji Kopi",
            unit: "gram",
            currentStock: new Prisma.Decimal("987.654"),
          },
        },
      ],
    },
    "https://example.test/kopi.webp",
  );

  assert.equal(cashierProduct.sellingPrice, "18000.5");
  assert.equal(cashierProduct.recipes[0].quantityNeeded, "12.345");
  assert.equal(cashierProduct.recipes[0].ingredient.currentStock, "987.654");
  assert.equal(cashierProduct.imageUrl, "https://example.test/kopi.webp");
  assert.equal("imagePath" in cashierProduct, false);

  const product = toProductRowDTO(
    {
      id: 1,
      categoryId: 2,
      name: "Kopi Susu",
      sellingPrice: new Prisma.Decimal("18000.50"),
      baseHpp: new Prisma.Decimal("5250.25"),
      imagePath: null,
      hasRecipe: true,
      isActive: true,
      category: { id: 2, name: "Kopi", isActive: true },
      _count: { recipes: 3 },
    },
    null,
  );

  assert.equal(product.sellingPrice, "18000.5");
  assert.equal(product.baseHpp, "5250.25");

  const ingredient = toIngredientRowDTO({
    id: 3,
    name: "Biji Kopi",
    unit: "gram",
    currentStock: new Prisma.Decimal("987.654"),
    stockValue: new Prisma.Decimal("123456.78"),
    averageCost: new Prisma.Decimal("125.0123"),
    minimumStock: new Prisma.Decimal("100.000"),
    isActive: true,
  });

  assert.deepEqual(
    {
      currentStock: ingredient.currentStock,
      stockValue: ingredient.stockValue,
      averageCost: ingredient.averageCost,
      minimumStock: ingredient.minimumStock,
    },
    {
      currentStock: "987.654",
      stockValue: "123456.78",
      averageCost: "125.0123",
      minimumStock: "100",
    },
  );

  assert.deepEqual(
    toPurchaseIngredientDTO({ id: 3, name: "Biji Kopi", unit: "gram" }),
    { id: 3, name: "Biji Kopi", unit: "gram" },
  );
});
