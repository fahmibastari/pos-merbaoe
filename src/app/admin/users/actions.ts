"use server";

import { revalidatePath } from "next/cache";
import {
  actionFailure,
  actionSuccess,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/guard";
import {
  createCashierSchema,
  field,
  parseOrThrow,
  resetUserPasswordSchema,
  setUserActiveSchema,
} from "@/lib/validation";
import {
  createCashierUser,
  resetUserPassword,
  setUserActive,
} from "@/lib/user-management";

function revalidateUsers() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
}

export async function createCashierAction(formData: FormData) {
  try {
    const session = await requireAdmin();
    const data = parseOrThrow(createCashierSchema, {
      name: field(formData, "name"),
      username: field(formData, "username"),
      password: field(formData, "password"),
      passwordConfirmation: field(formData, "passwordConfirmation"),
    });
    await createCashierUser(session.userId, {
      name: data.name,
      username: data.username,
      password: data.password,
    });
    revalidateUsers();
    return actionSuccess({ message: `Akun ${data.username} berhasil dibuat.` });
  } catch (error) {
    return actionFailure(error, { actionName: "createCashier" });
  }
}

export async function resetUserPasswordAction(formData: FormData) {
  try {
    const session = await requireAdmin();
    const data = parseOrThrow(resetUserPasswordSchema, {
      id: field(formData, "id"),
      password: field(formData, "password"),
      passwordConfirmation: field(formData, "passwordConfirmation"),
    });
    await resetUserPassword(session.userId, data.id, data.password);
    revalidateUsers();
    return actionSuccess({
      message: "Password berhasil direset. Seluruh sesi lama akun tersebut telah dicabut.",
    });
  } catch (error) {
    return actionFailure(error, { actionName: "resetUserPassword" });
  }
}

export async function setUserActiveAction(formData: FormData) {
  try {
    const session = await requireAdmin();
    const data = parseOrThrow(setUserActiveSchema, {
      id: field(formData, "id"),
      isActive: field(formData, "isActive"),
    });
    await setUserActive(session.userId, data.id, data.isActive);
    revalidateUsers();
    return actionSuccess({
      message: `Akun berhasil ${data.isActive ? "diaktifkan" : "dinonaktifkan"}.`,
    });
  } catch (error) {
    return actionFailure(error, { actionName: "setUserActive" });
  }
}
