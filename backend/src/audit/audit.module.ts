import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditEntity } from "./audit.entity";
import { AuditController } from "./audit.controller";
import { UserEntity } from "../auth/user.entity";
@Module({
  imports: [TypeOrmModule.forFeature([AuditEntity, UserEntity])],
  controllers: [AuditController],
})
export class AuditModule {}
