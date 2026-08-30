import type { CashierProductDTO } from "./dto";
import { toNumber } from "./money";

export const CASHIER_CART_TTL_MS = 8 * 60 * 60 * 1000;
const STORAGE_VERSION = 1;

type PersistedCartItem = {
  productId: number;
  quantity: number;
};

type PersistedCart = {
  version: number;
  savedAt: number;
  items: PersistedCartItem[];
};

export type RestoredCartItem = {
  product: CashierProductDTO;
  quantity: number;
};

export type RestoredCart = {
  status: "restored" | "empty" | "expired" | "invalid";
  items: RestoredCartItem[];
  discardedQuantity: number;
};

export function cashierCartStorageKey(cashierId: number, shiftId: number) {
  return `merbaoe:cashier-cart:v${STORAGE_VERSION}:${cashierId}:${shiftId}`;
}

export function cashierCartStoragePrefix(cashierId: number) {
  return `merbaoe:cashier-cart:v${STORAGE_VERSION}:${cashierId}:`;
}

export function serializeCashierCart(
  items: Array<{ product: { id: number }; quantity: number }>,
  savedAt = Date.now(),
) {
  const payload: PersistedCart = {
    version: STORAGE_VERSION,
    savedAt,
    items: items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    })),
  };
  return JSON.stringify(payload);
}

function invalidCart(status: RestoredCart["status"]): RestoredCart {
  return { status, items: [], discardedQuantity: 0 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function restoreCashierCart(
  raw: string | null,
  products: CashierProductDTO[],
  now = Date.now(),
): RestoredCart {
  if (!raw) return invalidCart("empty");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return invalidCart("invalid");
  }

  if (
    !isRecord(parsed) ||
    parsed.version !== STORAGE_VERSION ||
    typeof parsed.savedAt !== "number" ||
    !Number.isFinite(parsed.savedAt) ||
    parsed.savedAt > now + 60_000 ||
    now - parsed.savedAt > CASHIER_CART_TTL_MS ||
    !Array.isArray(parsed.items)
  ) {
    return invalidCart(
      isRecord(parsed) &&
        typeof parsed.savedAt === "number" &&
        now - parsed.savedAt > CASHIER_CART_TTL_MS
        ? "expired"
        : "invalid",
    );
  }

  const requestedByProduct = new Map<number, number>();
  let discardedQuantity = 0;
  for (const item of parsed.items) {
    if (
      !isRecord(item) ||
      !Number.isInteger(item.productId) ||
      Number(item.productId) <= 0 ||
      !Number.isInteger(item.quantity) ||
      Number(item.quantity) <= 0 ||
      Number(item.quantity) > 9999
    ) {
      return invalidCart("invalid");
    }
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    const combined = (requestedByProduct.get(productId) ?? 0) + quantity;
    if (combined > 9999) return invalidCart("invalid");
    requestedByProduct.set(productId, combined);
  }

  const productsById = new Map(products.map((product) => [product.id, product]));
  const ingredientUsage = new Map<number, number>();
  const restoredItems: RestoredCartItem[] = [];

  for (const [productId, requestedQuantity] of requestedByProduct) {
    const product = productsById.get(productId);
    if (!product) {
      discardedQuantity += requestedQuantity;
      continue;
    }

    let acceptedQuantity = requestedQuantity;
    if (product.hasRecipe && product.recipes.length > 0) {
      for (const recipe of product.recipes) {
        const neededPerPortion = toNumber(recipe.quantityNeeded);
        const alreadyUsed = ingredientUsage.get(recipe.ingredient.id) ?? 0;
        const available = Math.max(
          0,
          toNumber(recipe.ingredient.currentStock) - alreadyUsed,
        );
        if (neededPerPortion > 0) {
          acceptedQuantity = Math.min(
            acceptedQuantity,
            Math.floor((available + Number.EPSILON) / neededPerPortion),
          );
        }
      }
    }

    if (acceptedQuantity <= 0) {
      discardedQuantity += requestedQuantity;
      continue;
    }

    restoredItems.push({ product, quantity: acceptedQuantity });
    discardedQuantity += requestedQuantity - acceptedQuantity;
    for (const recipe of product.recipes) {
      const usage = toNumber(recipe.quantityNeeded) * acceptedQuantity;
      ingredientUsage.set(
        recipe.ingredient.id,
        (ingredientUsage.get(recipe.ingredient.id) ?? 0) + usage,
      );
    }
  }

  return {
    status: restoredItems.length > 0 ? "restored" : "empty",
    items: restoredItems,
    discardedQuantity,
  };
}
