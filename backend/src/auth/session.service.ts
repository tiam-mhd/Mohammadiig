import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { DataSource, LessThanOrEqual, MoreThan } from "typeorm";
import { SessionEntity } from "./session.entity";

@Injectable()
export class SessionService {
  constructor(private readonly dataSource: DataSource) {}
  async register(token: string, userId: string): Promise<void> {
    const sessions = this.dataSource.getRepository(SessionEntity);
    await sessions.delete({
      expiresAt: LessThanOrEqual(new Date().toISOString()),
    });
    await sessions.save({
      tokenHash: this.hash(token),
      userId,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
  }
  async validate(token: string, userId: string): Promise<void> {
    if (
      !(await this.dataSource.getRepository(SessionEntity).existsBy({
        tokenHash: this.hash(token),
        userId,
        expiresAt: MoreThan(new Date().toISOString()),
      }))
    )
      throw new UnauthorizedException(
        "نشست منقضی یا باطل شده است. دوباره وارد شوید.",
      );
  }
  async revoke(token: string): Promise<void> {
    await this.dataSource
      .getRepository(SessionEntity)
      .delete({ tokenHash: this.hash(token) });
  }
  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
