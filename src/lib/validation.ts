import { z } from "zod";
import { toWibDateString } from "./period";

/**
 * Validasi masukan Server Action — README §8.1.
 *
 * Ini lapisan pertama dari dua. Lapisan kedua adalah batasan `CHECK` pada basis
 * data (README §5). Keduanya disyaratkan dan saling melengkapi: `zod` memberi
 * pesan yang dapat dipahami pengguna, `CHECK` menjadi pengaman terakhir bila
 * ada jalur kode yang terlewat.
 *
 * Aturan minimum §8.1: harga dan kuantitas tidak boleh negatif, kuantitas
 * bilangan bulat positif, tanggal tidak melampaui hari ini, enum harus bernilai
 * sah.
 */

/** Galat validasi, dibedakan dari galat otorisasi dan galat bisnis. */
export class ValidationError extends Error {
  readonly kind = "validation" as const;
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function isValidationError(e: unknown): e is ValidationError {
  return e instanceof ValidationError;
}

/** Menjalankan skema dan melempar `ValidationError` yang siap ditampilkan. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (r.success) return r.data;

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of r.error.issues) {
    const key = issue.path.join(".") || "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  const first = r.error.issues[0]?.message ?? "Data yang dikirim tidak valid.";
  throw new ValidationError(first, fieldErrors);
}

// ── Primitif yang dipakai berulang ───────────────────────────────────────────

/** Teks wajib, dipangkas, dengan batas panjang kolom basis data. */
const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(1, `${label} wajib diisi.`)
    .max(max, `${label} maksimal ${max} karakter.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

/** Angka dari FormData: menolak string kosong, NaN, dan Infinity. */
const numeric = (label: string) =>
  z.coerce
    .number({ error: `${label} harus berupa angka.` })
    .refine(Number.isFinite, `${label} harus berupa angka.`);

/** Nominal uang: tidak negatif, dengan plafon wajar terhadap DECIMAL(14,2). */
const money = (label: string) =>
  numeric(label)
    .min(0, `${label} tidak boleh negatif.`)
    .max(9_999_999_999, `${label} terlalu besar.`);

/** Kuantitas bahan baku: harus lebih besar dari nol. */
const quantity = (label: string) =>
  numeric(label)
    .gt(0, `${label} harus lebih besar dari nol.`)
    .max(9_999_999, `${label} terlalu besar.`);

/** Tanggal kalender WIB, tidak boleh melampaui hari ini (README §8.1). */
const pastOrToday = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} harus berformat YYYY-MM-DD.`)
    .refine((v) => v <= toWibDateString(), `${label} tidak boleh melewati hari ini.`);

// ── Skema per Server Action ──────────────────────────────────────────────────

export const ingredientSchema = z.object({
  name: requiredText("Nama bahan", 100),
  unit: requiredText("Satuan", 20),
  minimumStock: money("Stok minimum"),
});

export const ingredientUpdateSchema = ingredientSchema.extend({
  id: z.coerce.number().int().positive("ID tidak sah."),
});

export const idSchema = z.object({
  id: z.coerce.number().int().positive("ID tidak sah."),
});

export const voidSaleSchema = z.object({
  saleId: z.coerce.number().int().positive("Transaksi tidak sah."),
  reason: requiredText("Alasan pembatalan", 255),
});

export const productSchema = z.object({
  name: requiredText("Nama menu", 100),
  categoryId: z.coerce.number().int().positive("Kategori wajib dipilih."),
  sellingPrice: money("Harga jual"),
  baseHpp: money("HPP dasar"),
});

export const productUpdateSchema = productSchema.extend({
  id: z.coerce.number().int().positive("ID tidak sah."),
});

export const productCategorySchema = z.object({
  name: requiredText("Nama kategori", 80),
  sortOrder: z.coerce
    .number({ error: "Urutan harus berupa angka." })
    .int("Urutan harus berupa bilangan bulat.")
    .min(0, "Urutan tidak boleh negatif.")
    .max(9999, "Urutan terlalu besar."),
});

export const productCategoryUpdateSchema = productCategorySchema.extend({
  id: z.coerce.number().int().positive("Kategori tidak sah."),
});

export const toggleActiveSchema = z.object({
  id: z.coerce.number().int().positive("ID tidak sah."),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export const recipeSchema = z
  .object({
    productId: z.coerce.number().int().positive("Produk tidak sah."),
    ingredientId: z.array(
      z.coerce.number().int().positive("Bahan baku tidak sah."),
    ),
    quantityNeeded: z.array(quantity("Takaran")),
  })
  .refine((value) => value.ingredientId.length <= 100, {
    message: "Resep tidak boleh melebihi 100 bahan baku.",
    path: ["ingredientId"],
  })
  .refine(
    (value) => value.ingredientId.length === value.quantityNeeded.length,
    {
      message: "Data baris resep tidak lengkap.",
      path: ["ingredientId"],
    },
  )
  .refine(
    (value) =>
      new Set(value.ingredientId).size === value.ingredientId.length,
    {
      message: "Satu bahan baku tidak boleh dimasukkan dua kali dalam resep.",
      path: ["ingredientId"],
    },
  );

export const purchaseSchema = z
  .object({
    supplierName: optionalText(100),
    purchaseDate: pastOrToday("Tanggal pembelian"),
    ingredientId: z.array(z.coerce.number().int().positive("Bahan baku tidak sah.")),
    quantity: z.array(quantity("Jumlah")),
    unitCost: z.array(money("Harga per satuan")),
  })
  .refine((v) => v.ingredientId.length > 0, {
    message: "Tambahkan minimal satu item pembelian.",
    path: ["ingredientId"],
  })
  .refine(
    (v) => v.ingredientId.length === v.quantity.length && v.quantity.length === v.unitCost.length,
    { message: "Data item pembelian tidak lengkap.", path: ["ingredientId"] }
  )
  .refine((v) => new Set(v.ingredientId).size === v.ingredientId.length, {
    message: "Satu bahan baku tidak boleh dimasukkan dua kali dalam satu pembelian.",
    path: ["ingredientId"],
  });

export const expenseSchema = z.object({
  description: requiredText("Deskripsi", 255),
  category: z.enum(["utilitas", "sewa", "pemeliharaan", "lain_lain"], {
    error: "Kategori tidak sah.",
  }),
  amount: money("Jumlah").gt(0, "Jumlah harus lebih besar dari nol."),
  expenseDate: pastOrToday("Tanggal"),
  cashierShiftId: z.union([
    z.literal("").transform(() => null),
    z.coerce.number().int().positive("Shift kasir tidak sah."),
  ]),
});

export const openShiftSchema = z.object({
  openingCash: money("Kas awal"),
});

export const closeShiftSchema = z.object({
  actualCash: money("Kas fisik"),
  notes: optionalText(255),
});

const stockQuantityField = (label: string, allowZero = false) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(1, `${label} wajib diisi.`)
    .transform(Number)
    .pipe(
      z
        .number({ error: `${label} harus berupa angka.` })
        .refine(Number.isFinite, `${label} harus berupa angka.`)
        .refine(
          (value) => (allowZero ? value >= 0 : value > 0),
          allowZero
            ? `${label} tidak boleh negatif.`
            : `${label} harus lebih besar dari nol.`,
        )
        .max(9_999_999, `${label} terlalu besar.`)
        .refine(
          (value) => Math.round(value * 1000) === value * 1000,
          `${label} maksimal memiliki 3 angka desimal.`,
        ),
    );

export const inventoryMutationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("adjustment"),
    ingredientId: z.coerce.number().int().positive("Bahan baku tidak sah."),
    physicalStock: stockQuantityField("Stok fisik", true),
    notes: requiredText("Keterangan", 255),
  }),
  z.object({
    kind: z.literal("waste"),
    ingredientId: z.coerce.number().int().positive("Bahan baku tidak sah."),
    quantity: stockQuantityField("Jumlah waste"),
    notes: requiredText("Keterangan", 255),
  }),
]);

/**
 * Payload checkout kasir.
 *
 * `quantity` WAJIB bilangan bulat positif. Tanpa ini, permintaan buatan dengan
 * kuantitas negatif akan membuat `decrement` menaikkan stok dan mencatat
 * penjualan bernilai negatif — temuan S5 pada `docs/checkpoint.md` §3.
 */
export const saleItemSchema = z.object({
  productId: z.coerce.number().int().positive("Produk tidak sah."),
  quantity: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat.")
    .gt(0, "Jumlah harus lebih besar dari nol.")
    .max(9999, "Jumlah terlalu besar."),
});

export const salePayloadSchema = z.object({
  idempotencyKey: z.uuid("Kunci transaksi tidak sah."),
  paymentMethod: z.enum(["cash", "qris", "transfer"], {
    error: "Metode pembayaran tidak sah.",
  }),
  discountAmount: money("Diskon"),
  taxRate: numeric("Tarif pajak")
    .min(0, "Tarif pajak tidak boleh negatif.")
    .max(1, "Tarif pajak tidak boleh melebihi 100%."),
  cashReceived: z.union([
    z.literal("").transform(() => null),
    money("Uang diterima"),
  ]),
  items: z
    .array(saleItemSchema, { error: "Data keranjang tidak sah." })
    .min(1, "Keranjang kosong.")
    .max(200, "Terlalu banyak item dalam satu transaksi."),
}).superRefine((value, context) => {
  const productIds = new Set<number>();
  value.items.forEach((item, index) => {
    if (productIds.has(item.productId)) {
      context.addIssue({
        code: "custom",
        path: ["items", index, "productId"],
        message: "Produk yang sama tidak boleh muncul dua kali.",
      });
    }
    productIds.add(item.productId);
  });

  if (value.paymentMethod === "cash" && value.cashReceived === null) {
    context.addIssue({
      code: "custom",
      path: ["cashReceived"],
      message: "Uang diterima wajib diisi untuk pembayaran tunai.",
    });
  }
});

// ── Pembantu FormData ────────────────────────────────────────────────────────

/** Mengambil satu nilai skalar dari FormData. */
export function field(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

/** Mengambil seluruh nilai berulang dari FormData (baris item dinamis). */
export function fields(fd: FormData, key: string): string[] {
  return fd.getAll(key).filter((v): v is string => typeof v === "string");
}
