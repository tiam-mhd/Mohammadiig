import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "auth_sessions" })
@Index("idx_auth_session_user", ["userId"])
export class SessionEntity {
  @PrimaryColumn({ name: "token_hash", type: "varchar", length: 64 })
  tokenHash!: string;
  @Column({ name: "user_id", type: "varchar", length: 100 }) userId!: string;
  @Column({ name: "expires_at", type: "varchar", length: 40 })
  expiresAt!: string;
}
