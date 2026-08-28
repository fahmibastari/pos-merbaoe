import type { Prisma } from "@/generated/prisma";
import { toDecimalDTO, type DecimalDTO } from "@/lib/money";

export const cashierProductSelect = {
  id: true,
  categoryId: true,
  name: true,
  sellingPrice: true,
  hasRecipe: true,
  imagePath: true,
  category: { select: { name: true } },
  recipes: {
    select: {
      quantityNeeded: true,
      ingredient: {
        select: {
          id: true,
          name: true,
          unit: true,
          currentStock: true,
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;

type CashierProductRecord = Prisma.ProductGetPayload<{
  select: typeof cashierProductSelect;
}>;

export type CashierProductDTO = {
  id: number;
  categoryId: number;
  category: { name: string };
  name: string;
  sellingPrice: DecimalDTO;
  hasRecipe: boolean;
  imageUrl: string | null;
  recipes: Array<{
    quantityNeeded: DecimalDTO;
    ingredient: {
      id: number;
      name: string;
      unit: string;
      currentStock: DecimalDTO;
    };
  }>;
};

export function toCashierProductDTO(
  product: CashierProductRecord,
  imageUrl: string | null,
): CashierProductDTO {
  return {
    id: product.id,
    categoryId: product.categoryId,
    category: product.category,
    name: product.name,
    sellingPrice: toDecimalDTO(product.sellingPrice),
    hasRecipe: product.hasRecipe,
    imageUrl,
    recipes: product.recipes.map((recipe) => ({
      quantityNeeded: toDecimalDTO(recipe.quantityNeeded),
      ingredient: {
        id: recipe.ingredient.id,
        name: recipe.ingredient.name,
        unit: recipe.ingredient.unit,
        currentStock: toDecimalDTO(recipe.ingredient.currentStock),
      },
    })),
  };
}

export const productRowSelect = {
  id: true,
  categoryId: true,
  name: true,
  sellingPrice: true,
  baseHpp: true,
  imagePath: true,
  hasRecipe: true,
  isActive: true,
  category: { select: { id: true, name: true, isActive: true } },
  _count: { select: { recipes: true } },
} satisfies Prisma.ProductSelect;

type ProductRowRecord = Prisma.ProductGetPayload<{
  select: typeof productRowSelect;
}>;

export type ProductRowDTO = {
  id: number;
  categoryId: number;
  name: string;
  sellingPrice: DecimalDTO;
  baseHpp: DecimalDTO;
  imagePath: string | null;
  imageUrl: string | null;
  hasRecipe: boolean;
  isActive: boolean;
  category: { id: number; name: string; isActive: boolean };
  _count: { recipes: number };
};

export function toProductRowDTO(
  product: ProductRowRecord,
  imageUrl: string | null,
): ProductRowDTO {
  return {
    ...product,
    sellingPrice: toDecimalDTO(product.sellingPrice),
    baseHpp: toDecimalDTO(product.baseHpp),
    imageUrl,
  };
}

export const ingredientRowSelect = {
  id: true,
  name: true,
  unit: true,
  currentStock: true,
  stockValue: true,
  averageCost: true,
  minimumStock: true,
  isActive: true,
} satisfies Prisma.IngredientSelect;

type IngredientRowRecord = Prisma.IngredientGetPayload<{
  select: typeof ingredientRowSelect;
}>;

export type IngredientRowDTO = {
  id: number;
  name: string;
  unit: string;
  currentStock: DecimalDTO;
  stockValue: DecimalDTO;
  averageCost: DecimalDTO;
  minimumStock: DecimalDTO;
  isActive: boolean;
};

export function toIngredientRowDTO(
  ingredient: IngredientRowRecord,
): IngredientRowDTO {
  return {
    ...ingredient,
    currentStock: toDecimalDTO(ingredient.currentStock),
    stockValue: toDecimalDTO(ingredient.stockValue),
    averageCost: toDecimalDTO(ingredient.averageCost),
    minimumStock: toDecimalDTO(ingredient.minimumStock),
  };
}

export const purchaseIngredientSelect = {
  id: true,
  name: true,
  unit: true,
} satisfies Prisma.IngredientSelect;

type PurchaseIngredientRecord = Prisma.IngredientGetPayload<{
  select: typeof purchaseIngredientSelect;
}>;

export type PurchaseIngredientDTO = {
  id: number;
  name: string;
  unit: string;
};

export function toPurchaseIngredientDTO(
  ingredient: PurchaseIngredientRecord,
): PurchaseIngredientDTO {
  return {
    id: ingredient.id,
    name: ingredient.name,
    unit: ingredient.unit,
  };
}
