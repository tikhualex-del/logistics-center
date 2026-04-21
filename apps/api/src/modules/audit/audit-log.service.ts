import { prisma } from "../../lib/prisma";
import { Prisma } from "../../generated/prisma/client";
import type { AuditActorContext } from "./audit-log.types";

export type CreateAuditLogInput = {
  companyId: string;
  actor: AuditActorContext;
  entityType: string;
  entityId?: string | null;
  action: string;
  metadata?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      companyId: input.companyId,
      actorType: input.actor.actorType,
      actorId: input.actor.actorId,
      actorLabel: input.actor.actorLabel,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      action: input.action,
      metadata: input.metadata,
    },
  });
}