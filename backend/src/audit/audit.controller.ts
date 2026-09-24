import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditEntity } from './audit.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@ApiTags('audit') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin') @Controller('audit')
export class AuditController {
  constructor(@InjectRepository(AuditEntity) private readonly repo: Repository<AuditEntity>) {}
  @Get('admin') async list(@Query('page') rawPage = '1', @Query('limit') rawLimit = '20', @Query('action') action?: string, @Query('entityType') entityType?: string) {
    const page = Math.max(1, Number(rawPage) || 1); const limit = Math.min(100, Math.max(1, Number(rawLimit) || 20));
    const qb = this.repo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    if (action) qb.andWhere('a.action = :action', { action }); if (entityType) qb.andWhere('a.entityType = :entityType', { entityType });
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
