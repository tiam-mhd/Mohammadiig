import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { normalizeMediaList, toRelativeMediaPath } from '../media/media-paths';
import { ProjectEntity } from './project.entity';
import { ManageOpsProjectDto } from './dto/manage-ops-project.dto';

@Injectable()
export class ProjectsService implements OnModuleInit {
  constructor(@InjectRepository(ProjectEntity) private readonly projects: Repository<ProjectEntity>) {}

  async onModuleInit(): Promise<void> {
    if ((await this.projects.count()) > 0) return;
    await this.projects.save(
      this.projects.create({
        id: randomUUID(),
        projectCode: `OPS-${new Date().getFullYear()}-0001`,
        projectName: 'بهره‌برداری مجموعه نمونه',
        nameEn: 'Sample Venue Operation',
        slug: 'sample-venue-operation',
        description:
          'پروژه بهره‌برداری مشترک برای یک مجموعه تفریحی؛ شامل تأمین تجهیزات، راه‌اندازی و مدیریت عملیاتی.',
        summaryFa: 'بهره‌برداری و مشارکت در یک مجموعه تفریحی نمونه.',
        customerId: null,
        clientDisplayName: 'شریک تجاری نمونه',
        assignedTo: null,
        projectType: 'operation',
        country: 'ایران',
        province: 'اصفهان',
        city: 'اصفهان',
        locationDetail: 'منطقه مرکزی شهر',
        startDate: '2024-01-10',
        expectedCompletionDate: '2024-08-01',
        completionDate: null,
        budgetTotal: 0,
        budgetSpent: 0,
        currency: 'IRR',
        migInvestmentPercentage: 40,
        profitSharingPercentage: 40,
        status: 'in_progress',
        coverImageUrl: null,
        gallery: [],
        highlights: ['بهره‌برداری', 'تأمین تجهیزات', 'مدیریت عملیات'],
        documents: [],
        isPublished: true,
        createdBy: 'system',
      }),
    );
  }

  private normalizeSlug(slug: string): string {
    return slug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
  }

  private emptyToNull(value?: string): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed ? trimmed : null;
  }

  private mediaOrNull(value?: string | null): string | null {
    const relative = toRelativeMediaPath(value);
    return relative || null;
  }

  private async uniqueCode(): Promise<string> {
    return `OPS-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  }

  findPublished(): Promise<ProjectEntity[]> {
    return this.projects.find({
      where: { isPublished: true },
      order: { startDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findPublishedBySlug(slug: string): Promise<ProjectEntity> {
    const project = await this.projects.findOne({ where: { slug, isPublished: true } });
    if (!project) throw new NotFoundException('پروژه پیدا نشد.');
    return project;
  }

  async findAllForAdmin(page = 1, limit = 20, search = '', sort = 'createdAt', order: 'asc'|'desc' = 'desc') { const qb = this.projects.createQueryBuilder('project'); if (search.trim()) qb.where('(LOWER(project.project_name) LIKE LOWER(:search) OR LOWER(project.slug) LIKE LOWER(:search))', { search: `%${search.trim()}%` }); const sortMap: Record<string,string> = { createdAt:'createdAt', projectName:'projectName' }; const [data,total] = await qb.orderBy(`project.${sortMap[sort] ?? 'createdAt'}`, order.toUpperCase() as 'ASC'|'DESC').skip((page-1)*limit).take(limit).getManyAndCount(); return { data, meta: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  }

  async create(dto: ManageOpsProjectDto, user?: AuthUser): Promise<ProjectEntity> {
    const slug = this.normalizeSlug(dto.slug);
    if (!slug) throw new ConflictException('شناسه پروژه معتبر نیست.');
    const existing = await this.projects.findOne({ where: { slug } });
    if (existing) throw new ConflictException('این شناسه پروژه از قبل وجود دارد.');

    return this.projects.save(
      this.projects.create({
        id: randomUUID(),
        projectCode: await this.uniqueCode(),
        projectName: dto.projectName.trim(),
        nameEn: this.emptyToNull(dto.nameEn),
        slug,
        description: dto.description.trim(),
        summaryFa: this.emptyToNull(dto.summaryFa),
        customerId: null,
        clientDisplayName: this.emptyToNull(dto.clientDisplayName),
        assignedTo: null,
        projectType: dto.projectType,
        country: this.emptyToNull(dto.country) ?? 'ایران',
        province: this.emptyToNull(dto.province),
        city: this.emptyToNull(dto.city),
        locationDetail: this.emptyToNull(dto.locationDetail),
        startDate: this.emptyToNull(dto.startDate),
        expectedCompletionDate: this.emptyToNull(dto.expectedCompletionDate),
        completionDate: this.emptyToNull(dto.completionDate),
        budgetTotal: dto.budgetTotal ?? 0,
        budgetSpent: 0,
        currency: 'IRR',
        migInvestmentPercentage: dto.migInvestmentPercentage ?? 0,
        profitSharingPercentage: dto.profitSharingPercentage ?? 0,
        status: dto.status ?? 'planning',
        coverImageUrl: this.mediaOrNull(dto.coverImageUrl),
        gallery: normalizeMediaList(dto.gallery),
        highlights: (dto.highlights ?? []).map((item) => item.trim()).filter(Boolean),
        documents: [],
        isPublished: dto.isPublished ?? false,
        createdBy: user?.userId ?? null,
      }),
    );
  }

  async update(id: string, dto: ManageOpsProjectDto): Promise<ProjectEntity> {
    const project = await this.projects.findOne({ where: { id } });
    if (!project) throw new NotFoundException('پروژه پیدا نشد.');

    const slug = this.normalizeSlug(dto.slug);
    if (!slug) throw new ConflictException('شناسه پروژه معتبر نیست.');
    const duplicate = await this.projects.findOne({ where: { slug } });
    if (duplicate && duplicate.id !== id) throw new ConflictException('این شناسه پروژه از قبل وجود دارد.');

    project.projectName = dto.projectName.trim();
    project.nameEn = this.emptyToNull(dto.nameEn);
    project.slug = slug;
    project.description = dto.description.trim();
    project.summaryFa = this.emptyToNull(dto.summaryFa);
    project.clientDisplayName = this.emptyToNull(dto.clientDisplayName);
    project.projectType = dto.projectType;
    project.country = this.emptyToNull(dto.country) ?? 'ایران';
    project.province = this.emptyToNull(dto.province);
    project.city = this.emptyToNull(dto.city);
    project.locationDetail = this.emptyToNull(dto.locationDetail);
    project.startDate = this.emptyToNull(dto.startDate);
    project.expectedCompletionDate = this.emptyToNull(dto.expectedCompletionDate);
    project.completionDate = this.emptyToNull(dto.completionDate);
    if (dto.budgetTotal !== undefined) project.budgetTotal = dto.budgetTotal;
    if (dto.migInvestmentPercentage !== undefined) project.migInvestmentPercentage = dto.migInvestmentPercentage;
    if (dto.profitSharingPercentage !== undefined) project.profitSharingPercentage = dto.profitSharingPercentage;
    if (dto.status !== undefined) project.status = dto.status;
    project.coverImageUrl = this.mediaOrNull(dto.coverImageUrl);
    project.gallery = normalizeMediaList(dto.gallery);
    project.highlights = (dto.highlights ?? []).map((item) => item.trim()).filter(Boolean);
    if (dto.isPublished !== undefined) project.isPublished = dto.isPublished;

    return this.projects.save(project);
  }

  async updateStatus(id: string, status: string): Promise<ProjectEntity> {
    const project = await this.projects.findOne({ where: { id } });
    if (!project) throw new NotFoundException('پروژه پیدا نشد.');
    project.status = status;
    return this.projects.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.projects.findOne({ where: { id } });
    if (!project) throw new NotFoundException('پروژه پیدا نشد.');
    await this.projects.softRemove(project);
  }
}
