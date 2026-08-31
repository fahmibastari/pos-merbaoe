import type { Prisma } from "@/generated/prisma/client";
import { safeAuditData } from "@/lib/audit";
import { paginate } from "@/lib/pagination";
import type { PeriodRange } from "@/lib/period";
import { prisma } from "@/lib/prisma";

export type AuditFilters = {
  period?: PeriodRange;
  userId?: number;
  entity?: string;
  action?: string;
  page: number;
  pageSize: number;
};

export async function getAuditReport(filters: AuditFilters) {
  const where: Prisma.AuditLogWhereInput = {
    ...(filters.period ? { createdAt: filters.period } : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(filters.action ? { action: filters.action } : {}),
  };

  const [totalItems, users, entityGroups, actionGroups] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.user.findMany({
      where: { auditLogs: { some: {} } },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, username: true },
    }),
    prisma.auditLog.groupBy({ by: ["entity"], orderBy: { entity: "asc" } }),
    prisma.auditLog.groupBy({ by: ["action"], orderBy: { action: "asc" } }),
  ]);
  const paging = paginate(totalItems, filters.page, filters.pageSize);
  const logs = await prisma.auditLog.findMany({
    where,
    skip: paging.skip,
    take: paging.take,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { user: { select: { name: true, username: true } } },
  });

  return {
    paging,
    users,
    entities: entityGroups.map((group) => group.entity),
    actions: actionGroups.map((group) => group.action),
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      createdAt: log.createdAt,
      user: log.user,
      beforeData: safeAuditData(log.beforeData),
      afterData: safeAuditData(log.afterData),
    })),
  };
}
