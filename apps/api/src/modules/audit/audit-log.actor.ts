import type { Request } from "express";
import type { AuditActorContext } from "./audit-log.types";

export function getAuditActorFromRequest(req: Request): AuditActorContext {
  const actorIdHeader = req.header("x-actor-id");
  const actorLabelHeader = req.header("x-actor-label");

  if (!actorIdHeader && !actorLabelHeader) {
    return {
      actorType: "system",
      actorId: null,
      actorLabel: "system",
    };
  }

  return {
    actorType: "user",
    actorId: actorIdHeader ?? null,
    actorLabel: actorLabelHeader ?? null,
  };
}