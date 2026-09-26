import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

@Entity({ name: "audit_logs" })
@Index("idx_audit_entity_created", ["entityType", "entityId", "createdAt"])
export class AuditEntity {
  @PrimaryColumn("text") id!: string;
  @Column({
    name: "actor_user_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  actorUserId!: string | null;
  @Column({ type: "varchar", length: 100 }) action!: string;
  @Column({ name: "entity_type", type: "varchar", length: 100 })
  entityType!: string;
  @Column({ name: "entity_id", type: "varchar", length: 100 })
  entityId!: string;
  @Column({ name: "old_value", type: "simple-json", nullable: true })
  oldValue!: Record<string, unknown> | null;
  @Column({ name: "new_value", type: "simple-json", nullable: true })
  newValue!: Record<string, unknown> | null;
  @Column({ name: "ip_address", type: "varchar", length: 100, nullable: true })
  ipAddress!: string | null;
  @Column({ name: "user_agent", type: "varchar", length: 500, nullable: true })
  userAgent!: string | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}
