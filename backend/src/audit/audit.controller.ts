import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditEntity } from './audit.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../auth/user.entity';

@ApiTags('audit') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin') @Controller('audit')
export class AuditController {
  constructor(@InjectRepository(AuditEntity) private readonly repo: Repository<AuditEntity>, @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>) {}
  @Get('admin') async list(@Query('page') rawPage = '1', @Query('limit') rawLimit = '20', @Query('action') action?: string, @Query('entityType') entityType?: string, @Query('actorUserId') actorUserId?: string, @Query('actorSearch') actorSearch?: string, @Query('from') from?: string, @Query('to') to?: string) {
    const page = Number(rawPage); const limit = Number(rawLimit);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new BadRequestException('شماره صفحه و تعداد نمایش معتبر نیست.');
    for (const value of [from, to]) if (value && Number.isNaN(Date.parse(value))) throw new BadRequestException('بازهٔ تاریخ معتبر نیست.');
    let actorMatches: UserEntity[] = [];
    if (actorSearch?.trim()) {
      const search = `%${actorSearch.trim().toLowerCase()}%`;
      actorMatches = await this.users.createQueryBuilder('u').where("LOWER(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') || ' ' || COALESCE(u.phone, '')) LIKE :search", { search }).getMany();
      if (actorMatches.length === 0) return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }
    const qb = this.repo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    if (action) qb.andWhere('a.action = :action', { action }); if (entityType) qb.andWhere('a.entityType = :entityType', { entityType });
    if (actorUserId) qb.andWhere('a.actorUserId = :actorUserId', { actorUserId });
    if (actorMatches.length) qb.andWhere('a.actorUserId IN (:...actorIds)', { actorIds: actorMatches.map((item) => item.id) });
    if (from) qb.andWhere('a.createdAt >= :from', { from: new Date(from).toISOString() });
    if (to) qb.andWhere('a.createdAt <= :to', { to: new Date(to).toISOString() });
    const [rows, total] = await qb.getManyAndCount();
    const actorIds = [...new Set(rows.map((row) => row.actorUserId).filter((id): id is string => Boolean(id)))];
    const actors = actorIds.length ? await this.users.findBy({ id: In(actorIds) }) : actorMatches;
    const actorById = new Map(actors.map((item) => [item.id, item]));
    const data = rows.map((row) => { const actor = actorById.get(row.actorUserId ?? ''); return { ...row, actorName: actor ? [actor.firstName, actor.lastName].filter(Boolean).join(' ') : null, actorPhone: actor?.phone ?? null }; });
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
