import { Prisma } from "@/generated/prisma/client";

const SENSITIVE_KEY = /(password|hash|token|secret|authorization|cookie)/i;

function normalizeAuditValue(value: unknown, key = ""): unknown {
  if (SENSITIVE_KEY.test(key)) return "[DISEMBUNYIKAN]";
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Prisma.Decimal) return value.toString();
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) {
    return value.map((item) => normalizeAuditValue(item));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        normalizeAuditValue(childValue, childKey),
      ]),
    );
  }
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  return String(value);
}

export function auditJson(value: unknown): Prisma.InputJsonValue {
  return normalizeAuditValue(value) as Prisma.InputJsonValue;
}

export function safeAuditData(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  return normalizeAuditValue(value) as Record<string, unknown>;
}

export function auditDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
