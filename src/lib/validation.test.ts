import assert from "node:assert/strict";
import test from "node:test";
import {
  closeShiftSchema,
  expenseSchema,
  inventoryMutationSchema,
  openShiftSchema,
  productCategorySchema,
  productUpdateSchema,
  recipeSchema,
  salePayloadSchema,
  voidSaleSchema,
} from "./validation";

const item = { productId: 1, quantity: 1 };
const idempotencyKey = "8d40c772-9e54-4cd0-82a4-2ca6b51ca339";

test("checkout tunai mewajibkan uang diterima", () => {
  const result = salePayloadSchema.safeParse({
    idempotencyKey,
    paymentMethod: "cash",
    discountAmount: "0",
    taxRate: "0.1",
    cashReceived: "",
    items: [item],
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0]?.path.join("."), "cashReceived");
  }
});

test("checkout nontunai tidak menyimpan uang diterima", () => {
  const result = salePayloadSchema.safeParse({
    idempotencyKey,
    paymentMethod: "qris",
    discountAmount: "5000",
    taxRate: "0",
    cashReceived: "",
    items: [item],
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.cashReceived, null);
});

test("checkout mewajibkan UUID dan menolak produk duplikat", () => {
  const invalidKey = salePayloadSchema.safeParse({
    idempotencyKey: "bukan-uuid",
    paymentMethod: "qris",
    discountAmount: "0",
    taxRate: "0",
    cashReceived: "",
    items: [item],
  });
  assert.equal(invalidKey.success, false);

  const duplicateProduct = salePayloadSchema.safeParse({
    idempotencyKey,
    paymentMethod: "qris",
    discountAmount: "0",
    taxRate: "0",
    cashReceived: "",
    items: [item, item],
  });
  assert.equal(duplicateProduct.success, false);
  if (!duplicateProduct.success) {
    assert.match(duplicateProduct.error.issues[0]?.message ?? "", /dua kali/);
  }
});

test("resep menolak bahan baku yang sama dua kali", () => {
  const result = recipeSchema.safeParse({
    productId: "1",
    ingredientId: ["2", "2"],
    quantityNeeded: ["10", "20"],
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error.issues[0]?.message ?? "", /dua kali/);
  }
});

test("resep menolak takaran nol dan menerima resep kosong", () => {
  const invalid = recipeSchema.safeParse({
    productId: "1",
    ingredientId: ["2"],
    quantityNeeded: ["0"],
  });
  assert.equal(invalid.success, false);

  const empty = recipeSchema.safeParse({
    productId: "1",
    ingredientId: [],
    quantityNeeded: [],
  });
  assert.equal(empty.success, true);
});

test("ubah produk menerima harga baru dan menolak nominal negatif", () => {
  const valid = productUpdateSchema.safeParse({
    id: "1",
    name: "Kopi Susu Baru",
    categoryId: "2",
    sellingPrice: "25000",
    baseHpp: "9000",
  });
  assert.equal(valid.success, true);

  const invalid = productUpdateSchema.safeParse({
    id: "1",
    name: "Kopi Susu Baru",
    categoryId: "2",
    sellingPrice: "-1",
    baseHpp: "9000",
  });
  assert.equal(invalid.success, false);
});

test("produk wajib memiliki kategori dan urutan kategori tidak boleh negatif", () => {
  const noCategory = productUpdateSchema.safeParse({
    id: "1",
    name: "Kopi Susu Baru",
    categoryId: "",
    sellingPrice: "25000",
    baseHpp: "9000",
  });
  assert.equal(noCategory.success, false);

  assert.equal(
    productCategorySchema.safeParse({ name: "Cemilan", sortOrder: "30" })
      .success,
    true,
  );
  assert.equal(
    productCategorySchema.safeParse({ name: "Cemilan", sortOrder: "-1" })
      .success,
    false,
  );
});

test("void mewajibkan ID transaksi dan alasan yang tidak kosong", () => {
  assert.equal(
    voidSaleSchema.safeParse({ saleId: "1", reason: "Salah input kasir" })
      .success,
    true,
  );
  assert.equal(
    voidSaleSchema.safeParse({ saleId: "1", reason: "   " }).success,
    false,
  );
  assert.equal(
    voidSaleSchema.safeParse({ saleId: "0", reason: "Salah input" }).success,
    false,
  );
});

test("shift menolak kas negatif dan menerima catatan tutup opsional", () => {
  assert.equal(openShiftSchema.safeParse({ openingCash: "100000" }).success, true);
  assert.equal(openShiftSchema.safeParse({ openingCash: "-1" }).success, false);
  const close = closeShiftSchema.safeParse({ actualCash: "125000", notes: "" });
  assert.equal(close.success, true);
  if (close.success) assert.equal(close.data.notes, null);
});

test("pengeluaran membedakan sumber luar laci dan shift aktif", () => {
  const base = {
    description: "Beli kebutuhan kecil",
    category: "lain_lain",
    amount: "10000",
    expenseDate: "2026-08-26",
  };
  const outsideDrawer = expenseSchema.safeParse({
    ...base,
    cashierShiftId: "",
  });
  assert.equal(outsideDrawer.success, true);
  if (outsideDrawer.success) assert.equal(outsideDrawer.data.cashierShiftId, null);
  assert.equal(
    expenseSchema.safeParse({ ...base, cashierShiftId: "4" }).success,
    true,
  );
  assert.equal(
    expenseSchema.safeParse({ ...base, cashierShiftId: "0" }).success,
    false,
  );
});

test("opname mewajibkan stok fisik dan keterangan", () => {
  assert.equal(
    inventoryMutationSchema.safeParse({
      kind: "adjustment",
      ingredientId: "1",
      physicalStock: "0",
      notes: "Hasil hitung fisik akhir hari",
    }).success,
    true,
  );
  assert.equal(
    inventoryMutationSchema.safeParse({
      kind: "adjustment",
      ingredientId: "1",
      physicalStock: "",
      notes: "Hasil opname",
    }).success,
    false,
  );
  assert.equal(
    inventoryMutationSchema.safeParse({
      kind: "adjustment",
      ingredientId: "1",
      physicalStock: "10",
      notes: "   ",
    }).success,
    false,
  );
});

test("waste mewajibkan jumlah positif maksimal tiga desimal", () => {
  const base = {
    kind: "waste",
    ingredientId: "1",
    notes: "Bahan tumpah",
  };
  assert.equal(
    inventoryMutationSchema.safeParse({ ...base, quantity: "1.125" }).success,
    true,
  );
  assert.equal(
    inventoryMutationSchema.safeParse({ ...base, quantity: "0" }).success,
    false,
  );
  assert.equal(
    inventoryMutationSchema.safeParse({ ...base, quantity: "1.1234" }).success,
    false,
  );
});
