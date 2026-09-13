import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ListProductsDto } from './dto/list-products.dto';
import { ProductEntity } from './product.entity';
import { Product, ProductListResponse } from './product.types';
import { CategoriesService } from './categories.service';
import { ManageProductDto } from './dto/manage-product.dto';
import { randomUUID } from 'node:crypto';

const imageBase = 'https://images.unsplash.com';

const seedProducts: Array<
  Pick<
    ProductEntity,
    | 'id'
    | 'sku'
    | 'nameEn'
    | 'nameFa'
    | 'slug'
    | 'descriptionShortFa'
    | 'specifications'
    | 'priceBase'
    | 'currency'
    | 'category'
    | 'thumbnailImageUrl'
    | 'gallery'
    | 'isActive'
    | 'isFeatured'
  >
> = [
  {
    id: '1', sku: 'MIG-BC-SIGNATURE', nameEn: 'Bumper Car Signature', nameFa: 'Bumper Car / سری Signature', slug: 'bumper-car-signature',
    descriptionShortFa: 'بدنه مهندسی شده، ایمنی بالا و آماده برای بهره برداری حرفه ای.', specifications: { audience: 'adult', power: 'electric' }, priceBase: 45000000, currency: 'IRR', category: 'EQUIPMENT',
    thumbnailImageUrl: `${imageBase}/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=900&q=85`,
    gallery: [`${imageBase}/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=900&q=85`],
    isActive: true, isFeatured: true,
  },
  {
    id: '2', sku: 'MIG-JUNIOR-PLAY', nameEn: 'Junior Play', nameFa: 'Junior / سری Play', slug: 'junior-play',
    descriptionShortFa: 'نسخه ایمن و پرانرژی برای تجربه ای ماندگار در فضاهای خانوادگی.', specifications: { audience: 'family', power: 'electric' }, priceBase: 15000000, currency: 'IRR', category: 'FAMILY',
    thumbnailImageUrl: `${imageBase}/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85`,
    gallery: [`${imageBase}/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85`],
    isActive: true, isFeatured: true,
  },
  {
    id: '3', sku: 'MIG-CARE-SPARES', nameEn: 'MIG Care Spare Parts', nameFa: 'MIG Care / قطعات یدکی', slug: 'mig-care-spare-parts',
    descriptionShortFa: 'قطعات اصلی و پشتیبانی فنی برای حفظ عملکرد بلندمدت مجموعه.', specifications: { support: 'after-sales', availability: 'stock' }, priceBase: 8500000, currency: 'IRR', category: 'AFTER-SALES',
    thumbnailImageUrl: `${imageBase}/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=85`,
    gallery: [`${imageBase}/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=85`],
    isActive: true, isFeatured: true,
  },
];

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(ProductEntity) private readonly repository: Repository<ProductEntity>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.categoriesService.seed();
    const count = await this.repository.count();
    if (count === 0) {
      await this.repository.save(seedProducts);
    } else {
      await this.backfillGalleries();
    }
  }

  /** One-time sync: empty gallery <- thumbnail_image_url */
  private async backfillGalleries(): Promise<void> {
    const rows = await this.repository.find();
    const pending = rows.filter((row) => {
      const gallery = Array.isArray(row.gallery) ? row.gallery.filter(Boolean) : [];
      return gallery.length === 0 && Boolean(row.thumbnailImageUrl?.trim());
    });
    for (const row of pending) {
      const url = row.thumbnailImageUrl!.trim();
      row.gallery = [url];
      await this.repository.save(row);
    }
  }

  async findAll(query: ListProductsDto): Promise<ProductListResponse> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .where('product.is_active = :isActive', { isActive: true })
      .andWhere('product.deleted_at IS NULL');

    if (query.category) {
      queryBuilder.andWhere('product.category = :category', { category: query.category });
    }

    const [entities, total] = await queryBuilder
      .orderBy('product.created_at', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return {
      data: entities.map((entity) => this.toProduct(entity)),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async findAllForAdmin(status: 'active' | 'trash' | 'all' = 'active'): Promise<Product[]> {
    const qb = this.repository.createQueryBuilder('product').withDeleted();

    if (status === 'active') {
      qb.andWhere('product.deleted_at IS NULL');
    } else if (status === 'trash') {
      qb.andWhere('product.deleted_at IS NOT NULL');
    }

    const entities = await qb.orderBy('product.updated_at', 'DESC').getMany();
    return entities.map((entity) => this.toProduct(entity));
  }

  async findOne(idOrSlug: string): Promise<Product> {
    const entity = await this.repository.findOne({ where: [{ id: idOrSlug }, { slug: idOrSlug }] });
    if (!entity || !entity.isActive || entity.deletedAt) {
      throw new NotFoundException('Product not found');
    }
    return this.toProduct(entity);
  }

  async findOneForAdmin(id: string): Promise<Product> {
    const entity = await this.repository.findOne({ where: { id }, withDeleted: true });
    if (!entity || entity.deletedAt) throw new NotFoundException('محصول پیدا نشد.');
    return this.toProduct(entity);
  }

  async create(dto: ManageProductDto): Promise<Product> {
    const slug = dto.slug.trim();
    const nameFa = dto.nameFa.trim();
    const sku = await this.resolveUniqueSku(dto.sku, slug);
    await this.assertUniqueIdentifiers(slug, sku);

    const images = this.normalizeImages(dto.images, dto.thumbnailImageUrl);
    const entity = await this.repository.save({
      id: randomUUID(),
      sku,
      nameEn: (dto.nameEn?.trim() || nameFa).slice(0, 200),
      nameFa,
      slug,
      descriptionShortFa: (dto.descriptionShortFa ?? '').trim().slice(0, 500),
      descriptionLongFa: dto.descriptionLongFa?.trim() || null,
      specifications: {},
      priceBase: dto.priceBase ?? 0,
      currency: 'IRR',
      category: (dto.category?.trim() || 'uncategorized').slice(0, 40),
      gallery: images,
      thumbnailImageUrl: images[0] ?? null,
      isActive: dto.isActive ?? false,
      isFeatured: dto.isFeatured ?? false,
    });
    return this.toProduct(entity);
  }

  async update(id: string, dto: Partial<ManageProductDto>): Promise<Product> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Product not found');

    const nextSlug = (dto.slug ?? entity.slug).trim();
    const nextSku =
      dto.sku !== undefined
        ? await this.resolveUniqueSku(dto.sku, nextSlug, id)
        : entity.sku;
    await this.assertUniqueIdentifiers(nextSlug, nextSku, id);

    if (dto.nameFa !== undefined) entity.nameFa = dto.nameFa.trim();
    if (dto.nameEn !== undefined) entity.nameEn = (dto.nameEn.trim() || entity.nameFa).slice(0, 200);
    if (dto.slug !== undefined) entity.slug = nextSlug;
    if (dto.sku !== undefined) entity.sku = nextSku;
    if (dto.descriptionShortFa !== undefined) {
      entity.descriptionShortFa = dto.descriptionShortFa.trim().slice(0, 500);
    }
    if (dto.descriptionLongFa !== undefined) entity.descriptionLongFa = dto.descriptionLongFa.trim() || null;
    if (dto.category !== undefined) {
      entity.category = (dto.category.trim() || 'uncategorized').slice(0, 40);
    }
    if (dto.priceBase !== undefined) entity.priceBase = dto.priceBase;
    if (dto.images !== undefined) {
      const images = this.normalizeImages(dto.images);
      entity.gallery = images;
      entity.thumbnailImageUrl = images[0] ?? null;
    } else if (dto.thumbnailImageUrl !== undefined) {
      const images = this.normalizeImages(undefined, dto.thumbnailImageUrl);
      entity.gallery = images;
      entity.thumbnailImageUrl = images[0] ?? null;
    }
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) entity.isFeatured = dto.isFeatured;

    return this.toProduct(await this.repository.save(entity));
  }

  async remove(id: string): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Product not found');
    // Soft-delete keeps the row; free unique slug/sku so new products can reuse them.
    entity.specifications = {
      ...(entity.specifications ?? {}),
      _deletedSlug: entity.slug,
      _deletedSku: entity.sku,
    };
    entity.slug = `deleted-${entity.id}`;
    entity.sku = `DEL-${entity.id.slice(0, 8)}`;
    await this.repository.save(entity);
    await this.repository.softRemove(entity);
  }

  async restore(id: string): Promise<Product> {
    const entity = await this.repository.findOne({ where: { id }, withDeleted: true });
    if (!entity || !entity.deletedAt) throw new NotFoundException('محصول حذف‌شده پیدا نشد.');

    const specs = (entity.specifications ?? {}) as Record<string, unknown>;
    const savedSlug = typeof specs._deletedSlug === 'string' ? specs._deletedSlug.trim() : '';
    const savedSku = typeof specs._deletedSku === 'string' ? specs._deletedSku.trim() : '';
    const short = entity.id.slice(0, 8);
    const nextSlug = savedSlug || `restored-${short}`;
    const nextSku = savedSku || `RES-${short}`;

    await this.assertUniqueIdentifiers(nextSlug, nextSku, id);
    entity.slug = nextSlug;
    entity.sku = nextSku;
    entity.isActive = true;
    delete specs._deletedSlug;
    delete specs._deletedSku;
    entity.specifications = specs;
    entity.deletedAt = null;
    return this.toProduct(await this.repository.save(entity));
  }

  async purge(id: string): Promise<void> {
    const entity = await this.repository.findOne({ where: { id }, withDeleted: true });
    if (!entity) throw new NotFoundException('محصول پیدا نشد.');
    await this.repository.remove(entity);
  }

  private async assertUniqueIdentifiers(slug: string, sku: string, excludeId?: string): Promise<void> {
    const slugOwner = await this.repository.findOne({
      where: excludeId ? { slug, id: Not(excludeId) } : { slug },
      withDeleted: true,
    });
    if (slugOwner && (!excludeId || slugOwner.id !== excludeId)) {
      throw new ConflictException('این شناسه آدرس از قبل برای محصول دیگری ثبت شده است.');
    }

    const skuOwner = await this.repository.findOne({
      where: excludeId ? { sku, id: Not(excludeId) } : { sku },
      withDeleted: true,
    });
    if (skuOwner && (!excludeId || skuOwner.id !== excludeId)) {
      throw new ConflictException('این کد کالا از قبل برای محصول دیگری ثبت شده است.');
    }
  }

  private async resolveUniqueSku(requested: string | undefined, slug: string, excludeId?: string): Promise<string> {
    const raw = (requested?.trim() || slug || 'product')
      .toUpperCase()
      .replace(/[^A-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    let candidate = raw || 'PRODUCT';
    let attempt = 0;
    while (attempt < 20) {
      const owner = await this.repository.findOne({
        where: excludeId ? { sku: candidate, id: Not(excludeId) } : { sku: candidate },
        withDeleted: true,
      });
      if (!owner || (excludeId && owner.id === excludeId)) return candidate;
      attempt += 1;
      candidate = `${raw.slice(0, 32)}-${attempt}`;
    }
    return `${raw.slice(0, 24)}-${Date.now().toString(36).toUpperCase()}`.slice(0, 50);
  }

  private normalizeImages(images?: string[] | null, fallbackThumbnail?: string | null): string[] {
    const fromList = Array.isArray(images)
      ? images.map((item) => String(item ?? '').trim()).filter(Boolean)
      : [];
    if (fromList.length > 0) {
      return Array.from(new Set(fromList)).slice(0, 30);
    }
    const single = (fallbackThumbnail ?? '').trim();
    return single ? [single] : [];
  }

  private resolveGallery(entity: ProductEntity): string[] {
    const gallery = Array.isArray(entity.gallery)
      ? entity.gallery.map((item) => String(item ?? '').trim()).filter(Boolean)
      : [];
    if (gallery.length > 0) return gallery;
    const thumb = (entity.thumbnailImageUrl ?? '').trim();
    return thumb ? [thumb] : [];
  }

  private toProduct(entity: ProductEntity): Product {
    const images = this.resolveGallery(entity);
    return {
      id: entity.id,
      name: entity.nameFa,
      nameEn: entity.nameEn,
      sku: entity.sku,
      slug: entity.slug,
      description: entity.descriptionShortFa,
      descriptionLong: entity.descriptionLongFa ?? null,
      price: entity.priceBase,
      currency: entity.currency,
      category: entity.category,
      image: images[0] ?? null,
      images,
      isActive: entity.isActive,
      isFeatured: entity.isFeatured,
      deletedAt: entity.deletedAt ? entity.deletedAt.toISOString() : null,
    };
  }
}
