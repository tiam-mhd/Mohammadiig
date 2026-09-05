import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListProductsDto } from './dto/list-products.dto';
import { ProductEntity } from './product.entity';
import { Product, ProductListResponse } from './product.types';
import { CategoriesService } from './categories.service';
import { ManageProductDto } from './dto/manage-product.dto';
import { randomUUID } from 'node:crypto';

const imageBase = 'https://images.unsplash.com';

const seedProducts: Array<Pick<ProductEntity, 'id' | 'sku' | 'nameEn' | 'nameFa' | 'slug' | 'descriptionShortFa' | 'specifications' | 'priceBase' | 'currency' | 'category' | 'thumbnailImageUrl' | 'isActive' | 'isFeatured'>> = [
  {
    id: '1', sku: 'MIG-BC-SIGNATURE', nameEn: 'Bumper Car Signature', nameFa: 'Bumper Car / سری Signature', slug: 'bumper-car-signature',
    descriptionShortFa: 'بدنه مهندسی شده، ایمنی بالا و آماده برای بهره برداری حرفه ای.', specifications: { audience: 'adult', power: 'electric' }, priceBase: 45000000, currency: 'IRR', category: 'EQUIPMENT',
    thumbnailImageUrl: `${imageBase}/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=900&q=85`, isActive: true, isFeatured: true,
  },
  {
    id: '2', sku: 'MIG-JUNIOR-PLAY', nameEn: 'Junior Play', nameFa: 'Junior / سری Play', slug: 'junior-play',
    descriptionShortFa: 'نسخه ایمن و پرانرژی برای تجربه ای ماندگار در فضاهای خانوادگی.', specifications: { audience: 'family', power: 'electric' }, priceBase: 15000000, currency: 'IRR', category: 'FAMILY',
    thumbnailImageUrl: `${imageBase}/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85`, isActive: true, isFeatured: true,
  },
  {
    id: '3', sku: 'MIG-CARE-SPARES', nameEn: 'MIG Care Spare Parts', nameFa: 'MIG Care / قطعات یدکی', slug: 'mig-care-spare-parts',
    descriptionShortFa: 'قطعات اصلی و پشتیبانی فنی برای حفظ عملکرد بلندمدت مجموعه.', specifications: { support: 'after-sales', availability: 'stock' }, priceBase: 8500000, currency: 'IRR', category: 'AFTER-SALES',
    thumbnailImageUrl: `${imageBase}/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=85`, isActive: true, isFeatured: true,
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

  async findOne(idOrSlug: string): Promise<Product> {
    const entity = await this.repository.findOne({ where: [{ id: idOrSlug }, { slug: idOrSlug }] });
    if (!entity || !entity.isActive || entity.deletedAt) {
      throw new NotFoundException('Product not found');
    }
    return this.toProduct(entity);
  }

  async create(dto: ManageProductDto): Promise<Product> {
    const entity = await this.repository.save({ id: randomUUID(), sku: dto.sku, nameEn: dto.nameEn, nameFa: dto.nameFa, slug: dto.slug, descriptionShortFa: dto.descriptionShortFa, specifications: {}, priceBase: dto.priceBase, currency: 'IRR', category: dto.category, thumbnailImageUrl: dto.thumbnailImageUrl ?? null, isActive: dto.isActive ?? true, isFeatured: dto.isFeatured ?? false });
    return this.toProduct(entity);
  }

  async update(id: string, dto: Partial<ManageProductDto>): Promise<Product> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Product not found');
    Object.assign(entity, dto);
    return this.toProduct(await this.repository.save(entity));
  }

  async remove(id: string): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Product not found');
    await this.repository.softRemove(entity);
  }

  private toProduct(entity: ProductEntity): Product {
    return {
      id: entity.id,
      name: entity.nameFa,
      slug: entity.slug,
      description: entity.descriptionShortFa,
      price: entity.priceBase,
      currency: entity.currency,
      category: entity.category,
      image: entity.thumbnailImageUrl,
      isFeatured: entity.isFeatured,
    };
  }
}
