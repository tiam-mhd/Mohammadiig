import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { EntityManager } from "typeorm";
import { AuditEntity } from "./audit.entity";

export interface AuditActor {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  static async record(
    manager: EntityManager,
    actor: AuditActor,
    action: string,
    entityType: string,
    entityId: string,
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null,
  ): Promise<void> {
    await manager.getRepository(AuditEntity).save({
      id: randomUUID(),
      actorUserId: actor.userId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress: actor.ipAddress?.slice(0, 100) ?? null,
      userAgent: actor.userAgent?.slice(0, 500) ?? null,
    });
  }
}
