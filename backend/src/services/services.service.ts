import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './service.entity';
import { ManageServiceDto } from './dto/manage-service.dto';
import { randomUUID } from 'node:crypto';
import { normalizeMediaList, toRelativeMediaPath } from '../media/media-paths';

const seedServices: Array<
  Pick<
    ServiceEntity,
    | 'id'
    | 'nameEn'
    | 'nameFa'
    | 'description'
    | 'serviceCategory'
    | 'basePrice'
    | 'priceNegotiable'
    | 'currency'
    | 'unitType'
    | 'coverImageUrl'
    | 'gallery'
    | 'isActive'
  >
> = [
  {
    id: 'installation',
    nameEn: 'Installation & Setup',
    nameFa: 'نصب و راه‌اندازی',
    description: 'نصب تخصصی تجهیزات و آماده‌سازی مجموعه برای بهره‌برداری.',
    serviceCategory: 'installation',
    basePrice: null,
    priceNegotiable: false,
    currency: 'IRR',
    unitType: 'fixed',
    coverImageUrl: null,
    gallery: [],
    isActive: true,
  },
  {
    id: 'training',
    nameEn: 'Operator Training',
    nameFa: 'آموزش اپراتور',
    description: 'آموزش تیم بهره‌برداری برای استفاده ایمن و حرفه‌ای.',
    serviceCategory: 'training',
    basePrice: null,
    priceNegotiable: false,
    currency: 'IRR',
    unitType: 'per_day',
    coverImageUrl: null,
    gallery: [],
    isActive: true,
  },
  {
    id: 'support',
    nameEn: 'MIG Care Support',
    nameFa: 'پشتیبانی MIG Care',
    description: 'پشتیبانی فنی و تامین قطعات برای عملکرد پایدار پروژه.',
    serviceCategory: 'support',
    basePrice: null,
    priceNegotiable: false,
    currency: 'IRR',
    unitType: 'per_visit',
    coverImageUrl: null,
    gallery: [],
    isActive: true,
  },
];

@Injectable()
export class ServicesService implements OnModuleInit {
  constructor(@InjectRepository(ServiceEntity) private readonly services: Repository<ServiceEntity>) {}

  async seed(): Promise<void> {
    if ((await this.services.count()) === 0) await this.services.save(seedServices);
  }

  onModuleInit(): Promise<void> {
    return this.seed();
  }

  private mediaOrNull(value?: string | null): string | null {
    const relative = toRelativeMediaPath(value);
    return relative || null;
  }

  private normalizeGallery(gallery?: string[] | null, cover?: string | null): string[] {
    const fromList = normalizeMediaList(gallery).slice(0, 30);
    if (fromList.length > 0) return fromList;
    const single = this.mediaOrNull(cover);
    return single ? [single] : [];
  }

  findAll(): Promise<ServiceEntity[]> {
    return this.services.find({ where: { isActive: true }, order: { createdAt: 'ASC' } });
  }

  async findAllForAdmin(page = 1, limit = 20) { const [data,total] = await this.services.findAndCount({ order: { createdAt: 'ASC' }, skip: (page-1)*limit, take: limit }); return { data, meta: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  }

  async findOneForAdmin(id: string): Promise<ServiceEntity> {
    const service = await this.services.findOne({ where: { id } });
    if (!service) throw new NotFoundException('خدمت پیدا نشد.');
    return service;
  }

  create(dto: ManageServiceDto): Promise<ServiceEntity> {
    const gallery = this.normalizeGallery(dto.gallery, dto.coverImageUrl);
    return this.services.save(
      this.services.create({
        id: randomUUID(),
        nameFa: dto.nameFa,
        nameEn: dto.nameEn,
        description: dto.description,
        serviceCategory: dto.serviceCategory,
        basePrice: dto.basePrice ?? null,
        priceNegotiable: dto.priceNegotiable ?? false,
        unitType: dto.unitType,
        currency: 'IRR',
        coverImageUrl: gallery[0] ?? this.mediaOrNull(dto.coverImageUrl),
        gallery,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async update(id: string, dto: Partial<ManageServiceDto>): Promise<ServiceEntity> {
    const service = await this.services.findOne({ where: { id } });
    if (!service) throw new NotFoundException('خدمت پیدا نشد.');
    if (dto.nameFa !== undefined) service.nameFa = dto.nameFa;
    if (dto.nameEn !== undefined) service.nameEn = dto.nameEn;
    if (dto.description !== undefined) service.description = dto.description;
    if (dto.serviceCategory !== undefined) service.serviceCategory = dto.serviceCategory;
    if (dto.basePrice !== undefined) service.basePrice = dto.basePrice;
    if (dto.priceNegotiable !== undefined) service.priceNegotiable = dto.priceNegotiable;
    if (dto.unitType !== undefined) service.unitType = dto.unitType;
    if (dto.isActive !== undefined) service.isActive = dto.isActive;
    if (dto.gallery !== undefined || dto.coverImageUrl !== undefined) {
      const gallery = this.normalizeGallery(
        dto.gallery ?? service.gallery,
        dto.coverImageUrl !== undefined ? dto.coverImageUrl : service.coverImageUrl,
      );
      service.gallery = gallery;
      service.coverImageUrl = gallery[0] ?? null;
    }
    return this.services.save(service);
  }
}
