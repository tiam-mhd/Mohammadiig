import { Module } from '@nestjs/common'; import { TypeOrmModule } from '@nestjs/typeorm'; import { AuditEntity } from './audit.entity'; import { AuditController } from './audit.controller';
@Module({ imports: [TypeOrmModule.forFeature([AuditEntity])], controllers: [AuditController] }) export class AuditModule {}
