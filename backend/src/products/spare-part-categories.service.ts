import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SparePartCategoryEntity } from './spare-part-category.entity';
import { SparePartCategory } from './spare-part-categories.types';
import { ManageCategoryDto } from './dto/manage-category.dto';

const seedCategories: Array<
  Pick<
    SparePartCategoryEntity,
    'id' | 'nameEn' | 'nameFa' | 'slug' | 'descriptionFa' | 'displayOrder' | 'isActive'
  >
> = [
  {
    id: 'motors',
    nameEn: 'Motors',
    nameFa: 'موتور و محرک',
    slug: 'motors',
    descriptionFa: 'موتور، گیربکس و قطعات محرک.',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'electrical',
    nameEn: 'Electrical',
    nameFa: 'برق و الکترونیک',
    slug: 'electrical',
    descriptionFa: 'برد، سنسور، کابل و قطعات الکتریکی.',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'mechanical',
    nameEn: 'Mechanical',
    nameFa: 'مکانیکی',
    slug: 'mechanical',
    descriptionFa: 'قطعات بدنه، شاسی و اتصالات مکانیکی.',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'consumables',
    nameEn: 'Consumables',
    nameFa: 'مصرفی',
    slug: 'consumables',
    descriptionFa: 'قطعات مصرفی و لوازم نگهداری.',
    displayOrder: 4,
    isActive: true,
  },
];

@Injectable()
export class SparePartCategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(SparePartCategoryEntity)
    private readonly repository: Repository<SparePartCategoryEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    if ((await this.repository.count()) === 0) await this.repository.save(seedCategories);
  }

  private toDto(category: SparePartCategoryEntity): SparePartCategory {
    return {
      id: category.id,
      nameEn: category.nameEn,
      nameFa: category.nameFa,
      slug: category.slug,
      descriptionFa: category.descriptionFa,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    };
  }

  private normalizeSlug(slug: string): string {
    return slug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
  }

  async findAll(): Promise<SparePartCategory[]> {
    const categories = await this.repository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
    return categories.map((category) => this.toDto(category));
  }

  async findAllForAdmin(): Promise<SparePartCategory[]> {
    const categories = await this.repository.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      withDeleted: false,
    });
    return categories.map((category) => this.toDto(category));
  }

  async create(dto: ManageCategoryDto): Promise<SparePartCategory> {
    const slug = this.normalizeSlug(dto.slug);
    if (!slug) throw new ConflictException('شناسه دسته معتبر نیست.');

    const existing = await this.repository.findOne({ where: [{ slug }, { id: slug }] });
    if (existing) throw new ConflictException('این شناسه دسته از قبل وجود دارد.');

    const category = await this.repository.save(
      this.repository.create({
        id: slug,
        nameFa: dto.nameFa.trim(),
        nameEn: dto.nameEn.trim(),
        slug,
        descriptionFa: dto.descriptionFa.trim(),
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      }),
    );
    return this.toDto(category);
  }

  async update(id: string, dto: ManageCategoryDto): Promise<SparePartCategory> {
    const category = await this.repository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('دسته پیدا نشد.');

    const slug = this.normalizeSlug(dto.slug);
    if (!slug) throw new ConflictException('شناسه دسته معتبر نیست.');

    const duplicate = await this.repository.findOne({ where: { slug } });
    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('این شناسه دسته از قبل وجود دارد.');
    }

    category.nameFa = dto.nameFa.trim();
    category.nameEn = dto.nameEn.trim();
    category.slug = slug;
    category.descriptionFa = dto.descriptionFa.trim();
    if (dto.displayOrder !== undefined) category.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    return this.toDto(await this.repository.save(category));
  }

  async remove(id: string): Promise<void> {
    const category = await this.repository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('دسته پیدا نشد.');
    await this.repository.softRemove(category);
  }
}
