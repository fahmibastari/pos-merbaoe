"use server";

import { revalidatePath } from "next/cache";
import { ActionError, actionFailure, actionSuccess } from "@/lib/action-result";
import { processSale } from "@/lib/checkout-service";
import { requireAuth } from "@/lib/guard";
import {
  closeShiftSchema,
  field,
  openShiftSchema,
  parseOrThrow,
  salePayloadSchema,
} from "@/lib/validation";
import {
  closeCashierShift,
  openCashierShift,
} from "@/lib/shift-service";

export async function openShift(formData: FormData) {
  try {
    const session = await requireAuth();
    const input = parseOrThrow(openShiftSchema, {
      openingCash: field(formData, "openingCash"),
    });
    const shift = await openCashierShift(session.userId, input.openingCash);

    revalidatePath("/cashier");
    revalidatePath("/cashier/shift");
    revalidatePath("/admin/shifts");
    revalidatePath("/admin/expenses");
    return actionSuccess({
      shiftId: shift.id,
      message: "Shift berhasil dibuka. POS siap digunakan.",
    });
  } catch (error) {
    return actionFailure(error, { actionName: "openShift" });
  }
}

export async function closeShift(formData: FormData) {
  try {
    const session = await requireAuth();
    const input = parseOrThrow(closeShiftSchema, {
      actualCash: field(formData, "actualCash"),
      notes: field(formData, "notes"),
    });
    const closed = await closeCashierShift(
      session.userId,
      input.actualCash,
      input.notes,
    );

    revalidatePath("/cashier");
    revalidatePath("/cashier/shift");
    revalidatePath("/admin/shifts");
    revalidatePath("/admin/expenses");
    return actionSuccess({
      ...closed,
      message: "Shift berhasil ditutup.",
    });
  } catch (error) {
    return actionFailure(error, { actionName: "closeShift" });
  }
}

export async function submitSale(formData: FormData) {
  try {
    const session = await requireAuth();

    // Payload keranjang berasal dari klien dan tidak boleh dipercaya. Validasi
    // server mencegah kuantitas negatif menaikkan stok (checkpoint §3, S5).
    let rawItems: unknown;
    try {
      rawItems = JSON.parse(field(formData, "items") || "null");
    } catch {
      throw new ActionError("Format data keranjang tidak dapat dibaca.");
    }

    const input = parseOrThrow(salePayloadSchema, {
      idempotencyKey: field(formData, "idempotencyKey"),
      paymentMethod: field(formData, "paymentMethod"),
      discountAmount: field(formData, "discountAmount"),
      taxRate: field(formData, "taxRate"),
      cashReceived: field(formData, "cashReceived"),
      items: rawItems,
    });

    const sale = await processSale(session.userId, input);

    revalidatePath("/cashier");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/ingredients");
    revalidatePath("/cashier/shift");
    revalidatePath("/admin/shifts");

    return actionSuccess(sale);
  } catch (error) {
    return actionFailure(error, { actionName: "submitSale" });
  }
}
