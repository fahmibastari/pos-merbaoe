import assert from "node:assert/strict";
import test from "node:test";
import {
  filterCatalogProducts,
  productCategorySlug,
} from "./product-category";

test("slug kategori stabil untuk spasi, simbol, dan aksen", () => {
  assert.equal(productCategorySlug("  Non Kopi  "), "non-kopi");
  assert.equal(productCategorySlug("Café & Snack"), "cafe-snack");
  assert.equal(productCategorySlug("!!!"), "");
});

test("filter katalog menggabungkan kategori dan pencarian", () => {
  const products = [
    { id: 1, name: "Americano", categoryId: 1 },
    { id: 2, name: "Es Kopi Susu", categoryId: 1 },
    { id: 3, name: "Matcha Latte", categoryId: 2 },
  ];

  assert.deepEqual(
    filterCatalogProducts(products, "kopi", 1).map((item) => item.id),
    [2],
  );
  assert.deepEqual(
    filterCatalogProducts(products, "latte", 1).map((item) => item.id),
    [],
  );
  assert.equal(filterCatalogProducts(products, "", null).length, 3);
});
