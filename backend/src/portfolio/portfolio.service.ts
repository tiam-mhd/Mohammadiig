import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { PortfolioWorkEntity } from './portfolio-work.entity';
import { ManagePortfolioWorkDto } from './dto/manage-portfolio-work.dto';

@Injectable()
export class PortfolioService implements OnModuleInit {
  constructor(
    @InjectRepository(PortfolioWorkEntity)
    private readonly repository: Repository<PortfolioWorkEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.repository.count({ withDeleted: true });
    if (existing > 0) return;
    await this.repository.save([
      this.repository.create({
        id: randomUUID(),
        slug: 'bumper-cars-family-hall',
        titleFa: 'سالن ماشین برخوردی خانوادگی',
        titleEn: 'Family Bumper Cars Hall',
        summaryFa: 'طراحی، تأمین و راه‌اندازی سالن ماشین برخوردی برای یک مجموعه خانوادگی.',
        descriptionFa:
          'در این نمونه‌کار، سالن از صفر تجهیز شد: جانمایی دستگاه‌ها، ایمنی مسیر، آموزش اپراتور و تحویل آماده بهره‌برداری.',
        clientName: 'مجموعه تفریحی نمونه',
        workCategory: 'entertainment',
        country: 'ایران',
        province: 'تهران',
        city: 'تهران',
        locationDetail: 'منطقه غربی تهران',
        startDate: '2024-03-01',
        endDate: '2024-06-15',
        coverImageUrl: null,
        gallery: [],
        highlights: ['نصب کامل', 'آموزش تیم', 'پشتیبانی راه‌اندازی'],
        areaOrCapacity: '۱۲ دستگاه',
        isPublished: true,
        isFeatured: true,
        displayOrder: 1,
      }),
    ]);
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

  findPublished(): Promise<PortfolioWorkEntity[]> {
    return this.repository.find({
      where: { isPublished: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findPublishedBySlug(slug: string): Promise<PortfolioWorkEntity> {
    const item = await this.repository.findOne({ where: { slug, isPublished: true } });
    if (!item) throw new NotFoundException('نمونه‌کار پیدا نشد.');
    return item;
  }

  findAllForAdmin(): Promise<PortfolioWorkEntity[]> {
    return this.repository.find({ order: { displayOrder: 'ASC', createdAt: 'DESC' } });
  }

  async create(dto: ManagePortfolioWorkDto): Promise<PortfolioWorkEntity> {
    const slug = this.normalizeSlug(dto.slug);
    if (!slug) throw new ConflictException('شناسه نمونه‌کار معتبر نیست.');
    const existing = await this.repository.findOne({ where: { slug } });
    if (existing) throw new ConflictException('این شناسه از قبل وجود دارد.');

    return this.repository.save(
      this.repository.create({
        id: randomUUID(),
        slug,
        titleFa: dto.titleFa.trim(),
        titleEn: dto.titleEn.trim(),
        summaryFa: dto.summaryFa.trim(),
        descriptionFa: dto.descriptionFa.trim(),
        clientName: this.emptyToNull(dto.clientName),
        workCategory: dto.workCategory?.trim() || 'entertainment',
        country: this.emptyToNull(dto.country) ?? 'ایران',
        province: this.emptyToNull(dto.province),
        city: this.emptyToNull(dto.city),
        locationDetail: this.emptyToNull(dto.locationDetail),
        startDate: this.emptyToNull(dto.startDate),
        endDate: this.emptyToNull(dto.endDate),
        coverImageUrl: this.emptyToNull(dto.coverImageUrl),
        gallery: (dto.gallery ?? []).map((item) => item.trim()).filter(Boolean),
        highlights: (dto.highlights ?? []).map((item) => item.trim()).filter(Boolean),
        areaOrCapacity: this.emptyToNull(dto.areaOrCapacity),
        isPublished: dto.isPublished ?? true,
        isFeatured: dto.isFeatured ?? false,
        displayOrder: dto.displayOrder ?? 0,
      }),
    );
  }

  async update(id: string, dto: ManagePortfolioWorkDto): Promise<PortfolioWorkEntity> {
    const item = await this.repository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('نمونه‌کار پیدا نشد.');

    const slug = this.normalizeSlug(dto.slug);
    if (!slug) throw new ConflictException('شناسه نمونه‌کار معتبر نیست.');
    const duplicate = await this.repository.findOne({ where: { slug } });
    if (duplicate && duplicate.id !== id) throw new ConflictException('این شناسه از قبل وجود دارد.');

    item.slug = slug;
    item.titleFa = dto.titleFa.trim();
    item.titleEn = dto.titleEn.trim();
    item.summaryFa = dto.summaryFa.trim();
    item.descriptionFa = dto.descriptionFa.trim();
    item.clientName = this.emptyToNull(dto.clientName);
    item.workCategory = dto.workCategory?.trim() || item.workCategory;
    item.country = this.emptyToNull(dto.country) ?? 'ایران';
    item.province = this.emptyToNull(dto.province);
    item.city = this.emptyToNull(dto.city);
    item.locationDetail = this.emptyToNull(dto.locationDetail);
    item.startDate = this.emptyToNull(dto.startDate);
    item.endDate = this.emptyToNull(dto.endDate);
    item.coverImageUrl = this.emptyToNull(dto.coverImageUrl);
    item.gallery = (dto.gallery ?? []).map((value) => value.trim()).filter(Boolean);
    item.highlights = (dto.highlights ?? []).map((value) => value.trim()).filter(Boolean);
    item.areaOrCapacity = this.emptyToNull(dto.areaOrCapacity);
    if (dto.isPublished !== undefined) item.isPublished = dto.isPublished;
    if (dto.isFeatured !== undefined) item.isFeatured = dto.isFeatured;
    if (dto.displayOrder !== undefined) item.displayOrder = dto.displayOrder;

    return this.repository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.repository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('نمونه‌کار پیدا نشد.');
    await this.repository.softRemove(item);
  }
}
