import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { ActionError } from "./action-result";
import { prisma } from "./prisma";

export type ApprovalCredentials = { approvalAdminId?: number; approvalPin?: string };
type ApprovalProof = { adminId: number; pinHash: string };
export const APPROVAL_WINDOW_MS = 15 * 60 * 1000;
const INVALID_APPROVAL = "Persetujuan tidak valid atau sementara dibatasi. Periksa Admin dan PIN, lalu coba lagi.";
const DUMMY_HASH = "$2b$10$mb1FtMF3AElSEmHQLWNhKegZhG5YqxPV1StT4ju6RpSL8t4IXWpwG";

export function getApprovalAdmins() {
  return prisma.user.findMany({ where: { role: "admin", isActive: true }, select: { id: true, name: true }, orderBy: { id: "asc" } });
}

/** Failure is returned inside the transaction so its throttle update commits. */
export async function verifyApproval(actorId: number, scope: "discount" | "void", credentials: ApprovalCredentials, now = new Date()): Promise<ApprovalProof> {
  const proof = await prisma.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({ where: { id: actorId, isActive: true }, select: { id: true } });
    if (!actor) return null;
    await tx.$executeRaw`INSERT INTO approval_attempts (actor_id, action_scope, failed_count, window_started_at, updated_at)
      VALUES (${actorId}, ${scope}, 0, ${now}, ${now}) ON CONFLICT (actor_id, action_scope) DO NOTHING`;
    const [attempt] = await tx.$queryRaw<{ failedCount: number; windowStartedAt: Date; blockedUntil: Date | null }[]>`
      SELECT failed_count AS "failedCount", window_started_at AS "windowStartedAt", blocked_until AS "blockedUntil"
      FROM approval_attempts WHERE actor_id = ${actorId} AND action_scope = ${scope} FOR UPDATE`;
    if (attempt.blockedUntil && attempt.blockedUntil > now) return null;
    const freshWindow = now.getTime() - attempt.windowStartedAt.getTime() >= APPROVAL_WINDOW_MS;
    const admin = Number.isSafeInteger(credentials.approvalAdminId) && credentials.approvalAdminId! > 0
      ? await tx.user.findFirst({ where: { id: credentials.approvalAdminId, role: "admin", isActive: true }, select: { id: true, approvalPinHash: true } })
      : null;
    const pin = credentials.approvalPin ?? "";
    const matches = await bcrypt.compare(pin, admin?.approvalPinHash ?? DUMMY_HASH);
    const valid = /^\d{6}$/.test(pin) && matches && admin?.approvalPinHash;
    if (valid && admin) {
      await tx.approvalAttempt.update({ where: { actorId_actionScope: { actorId, actionScope: scope } }, data: { failedCount: 0, blockedUntil: null, windowStartedAt: now } });
      return { adminId: admin.id, pinHash: admin.approvalPinHash! };
    }
    const failedCount = (freshWindow ? 0 : attempt.failedCount) + 1;
    await tx.approvalAttempt.update({ where: { actorId_actionScope: { actorId, actionScope: scope } }, data: {
      failedCount, windowStartedAt: freshWindow ? now : attempt.windowStartedAt,
      blockedUntil: failedCount >= 5 ? new Date(now.getTime() + APPROVAL_WINDOW_MS) : null,
    } });
    return null;
  }, { timeout: 15_000 });
  if (!proof) throw new ActionError(INVALID_APPROVAL);
  return proof;
}

/** Recheck under a shared lock so resetting/disabling the approver cannot race the sale. */
export async function lockApproval(tx: Prisma.TransactionClient, proof: ApprovalProof) {
  const admins = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM users
    WHERE id = ${proof.adminId} AND role = 'admin' AND is_active = TRUE AND approval_pin_hash = ${proof.pinHash} FOR SHARE`;
  if (!admins.length) throw new ActionError(INVALID_APPROVAL);
}

export async function setApprovalPin(actorId: number, targetId: number, pin: string) {
  if (!/^\d{6}$/.test(pin)) throw new ActionError("PIN harus terdiri dari 6 digit.");
  const hash = await bcrypt.hash(pin, 10);
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({ where: { id: actorId, role: "admin", isActive: true }, select: { id: true } });
    const target = await tx.user.findFirst({ where: { id: targetId, role: "admin", isActive: true }, select: { id: true } });
    if (!actor || !target) throw new ActionError("PIN hanya dapat diatur untuk Admin aktif oleh Admin.");
    await tx.user.update({ where: { id: targetId }, data: { approvalPinHash: hash } });
    await tx.auditLog.create({ data: { userId: actorId, entity: "user", entityId: targetId, action: "update", afterData: { approvalEnabled: true, change: "PIN persetujuan diatur ulang" } } });
  });
}
