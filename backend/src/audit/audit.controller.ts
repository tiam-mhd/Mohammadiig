import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  @Get('admin') async list(@Query('page') rawPage = '1', @Query('limit') rawLimit = '20', @Query('action') action?: string, @Query('entityType') entityType?: string, @Query('actorUserId') actorUserId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    const page = Number(rawPage); const limit = Number(rawLimit);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new BadRequestException('شماره صفحه و تعداد نمایش معتبر نیست.');
    for (const value of [from, to]) if (value && Number.isNaN(Date.parse(value))) throw new BadRequestException('بازهٔ تاریخ معتبر نیست.');
    const qb = this.repo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    if (action) qb.andWhere('a.action = :action', { action }); if (entityType) qb.andWhere('a.entityType = :entityType', { entityType });
    if (actorUserId) qb.andWhere('a.actorUserId = :actorUserId', { actorUserId });
    if (from) qb.andWhere('a.createdAt >= :from', { from: new Date(from).toISOString() });
    if (to) qb.andWhere('a.createdAt <= :to', { to: new Date(to).toISOString() });
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
