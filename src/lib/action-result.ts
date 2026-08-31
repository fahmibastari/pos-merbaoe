import { Prisma } from "@/generated/prisma/client";
import { isAuthorizationError } from "@/lib/guard";
import { isValidationError } from "@/lib/validation";

export type FieldErrors = Record<string, string[]>;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

type FailureOptions = {
  actionName: string;
  foreignKeyMessage?: string;
};

const GENERIC_ERROR =
  "Terjadi kesalahan pada server. Silakan coba lagi beberapa saat lagi.";

export function actionFailure(
  error: unknown,
  options: FailureOptions,
): ActionResult<never> {
  if (isValidationError(error)) {
    return {
      ok: false,
      error: error.message,
      fieldErrors: error.fieldErrors,
    };
  }

  if (isAuthorizationError(error) || error instanceof ActionError) {
    return { ok: false, error: error.message };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        ok: false,
        error: "Data dengan nilai yang sama sudah terdaftar.",
      };
    }

    if (error.code === "P2003") {
      return {
        ok: false,
        error:
          options.foreignKeyMessage ??
          "Data tidak dapat dihapus karena masih digunakan oleh data lain.",
      };
    }

    if (error.code === "P2025") {
      return { ok: false, error: "Data yang diminta tidak ditemukan." };
    }
  }

  console.error(`[Server Action:${options.actionName}]`, error);
  return { ok: false, error: GENERIC_ERROR };
}
