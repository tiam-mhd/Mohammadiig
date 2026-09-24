import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { In, Repository } from 'typeorm';
import { ProductEntity } from './product.entity';
import { AuditActor, AuditService } from '../audit/audit.service';
import { ProductVariantEntity } from './product-variant.entity';
import { ProductSpecificationEntity } from './product-specification.entity';
import { SparePartEntity } from './spare-part.entity';
import { normalizeMediaList, toRelativeMediaPath } from '../media/media-paths';
import { ManageSparePartDto, PatchSparePartDto } from './dto/manage-spare-part.dto';
import { SparePartSpec } from './spare-part.entity';
import {
  CopyProductSpecsDto,
  ManageProductSpecificationDto,
  ManageProductVariantDto,
  ProductSpecCategory,
  ReorderProductSpecificationsDto,
} from './dto/manage-product-extensions.dto';

@Injectable()
export class ProductExtensionsService implements OnModuleInit {
  constructor(
    @InjectRepository(ProductVariantEntity) private readonly variants: Repository<ProductVariantEntity>,
    @InjectRepository(ProductSpecificationEntity)
    private readonly specifications: Repository<ProductSpecificationEntity>,
    @InjectRepository(SparePartEntity) private readonly spareParts: Repository<SparePartEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const [signature, junior] = await Promise.all([
      this.products.findOne({ where: { id: '1' } }),
      this.products.findOne({ where: { id: '2' } }),
    ]);
    if ((await this.variants.count()) === 0 && signature && junior) {
      await this.variants.save([
        {
          id: randomUUID(),
          productId: signature.id,
          skuVariant: 'MIG-BC-SIG-STD',
          variantNameEn: 'Signature Standard',
          variantNameFa: 'Signature استاندارد',
          variantCode: 'STD',
          specifications: { seats: 1 },
          priceBase: signature.priceBase,
          priceAdjustment: 0,
          currency: 'IRR',
          stockQuantity: 8,
          isActive: true,
        },
        {
          id: randomUUID(),
          productId: signature.id,
          skuVariant: 'MIG-BC-SIG-PRO',
          variantNameEn: 'Signature Pro',
          variantNameFa: 'Signature حرفه‌ای',
          variantCode: 'PRO',
          specifications: { seats: 2 },
          priceBase: signature.priceBase,
          priceAdjustment: 7500000,
          currency: 'IRR',
          stockQuantity: 3,
          isActive: true,
        },
        {
          id: randomUUID(),
          productId: junior.id,
          skuVariant: 'MIG-JUNIOR-RED',
          variantNameEn: 'Junior Red',
          variantNameFa: 'Junior قرمز',
          variantCode: 'RED',
          specifications: { color: 'red' },
          priceBase: junior.priceBase,
          priceAdjustment: 0,
          currency: 'IRR',
          stockQuantity: 12,
          isActive: true,
        },
      ]);
    }
    if ((await this.specifications.count()) === 0 && signature && junior) {
      await this.specifications.save([
        {
          id: randomUUID(),
          productId: signature.id,
          specificationKey: 'توان',
          specificationValue: 'برقی',
          unit: null,
          specCategory: 'technical',
          displayOrder: 1,
        },
        {
          id: randomUUID(),
          productId: signature.id,
          specificationKey: 'مخاطب',
          specificationValue: 'بزرگسال',
          unit: null,
          specCategory: 'technical',
          displayOrder: 2,
        },
        {
          id: randomUUID(),
          productId: junior.id,
          specificationKey: 'مخاطب',
          specificationValue: 'خانوادگی',
          unit: null,
          specCategory: 'technical',
          displayOrder: 1,
        },
      ]);
    }
    if ((await this.spareParts.count()) === 0) {
      await this.spareParts.save([
        {
          id: randomUUID(),
          partNumber: 'MIG-SP-MOTOR-A',
          slug: 'mig-sp-motor-a',
          nameEn: 'Drive Motor A',
          nameFa: 'موتور محرک سری A',
          shortDescription: 'موتور محرک اصلی برای خطوط تولید MIG',
          description: 'موتور یدکی سازگار با تجهیزات MIG با گارانتی اصالت و تست کارخانه.',
          category: 'motors',
          compatibleProducts: ['1', '2'],
          price: 3500000,
          priceNegotiable: false,
          currency: 'IRR',
          stockQuantity: 24,
          reorderLevel: 5,
          imageUrl: null,
          gallery: [],
          brand: 'MIG',
          oemCode: 'DRV-A-01',
          weightGrams: 4200,
          dimensions: '18×12×10 cm',
          specs: [
            { key: 'ولتاژ', value: '220', unit: 'V' },
            { key: 'توان', value: '1.5', unit: 'kW' },
          ],
          warrantyMonths: 12,
          isActive: true,
        },
        {
          id: randomUUID(),
          partNumber: 'MIG-SP-BATTERY-L',
          slug: 'mig-sp-battery-l',
          nameEn: 'Lithium Battery Pack',
          nameFa: 'پک باتری لیتیومی',
          shortDescription: 'پک باتری قابل شارژ برای استفاده مداوم',
          description: 'پک باتری لیتیومی با ظرفیت بالا برای نگهداری بدون وقفه تجهیزات.',
          category: 'electrical',
          compatibleProducts: ['1', '2'],
          price: 2500000,
          priceNegotiable: false,
          currency: 'IRR',
          stockQuantity: 15,
          reorderLevel: 5,
          imageUrl: null,
          gallery: [],
          brand: 'MIG',
          oemCode: 'BAT-L-02',
          weightGrams: 1800,
          dimensions: '25×12×8 cm',
          specs: [
            { key: 'ظرفیت', value: '48', unit: 'Ah' },
            { key: 'ولتاژ', value: '24', unit: 'V' },
          ],
          warrantyMonths: 12,
          isActive: true,
        },
      ]);
    } else {
      const allParts = await this.spareParts.find();
      for (const part of allParts) {
        if (!part.slug?.trim()) {
          part.slug = await this.ensureUniqueSlug(this.slugifyPartNumber(part.partNumber), part.id);
          if (!Array.isArray(part.gallery)) part.gallery = [];
          if (!Array.isArray(part.specs)) part.specs = [];
          await this.spareParts.save(part);
        }
      }
    }
  }

  private async assertProductExists(productId: string): Promise<ProductEntity> {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('محصول پیدا نشد.');
    return product;
  }

  findVariants(productId: string): Promise<ProductVariantEntity[]> {
    return this.variants.find({ where: { productId, isActive: true }, order: { createdAt: 'ASC' } });
  }

  findVariantsForAdmin(productId: string): Promise<ProductVariantEntity[]> {
    return this.variants.find({ where: { productId }, order: { createdAt: 'ASC' } });
  }

  findSpecifications(productId: string): Promise<ProductSpecificationEntity[]> {
    return this.specifications.find({
      where: { productId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async createSpecification(
    productId: string,
    dto: ManageProductSpecificationDto,
  ): Promise<ProductSpecificationEntity> {
    await this.assertProductExists(productId);
    const maxOrder = await this.specifications
      .createQueryBuilder('s')
      .select('MAX(s.display_order)', 'max')
      .where('s.product_id = :productId', { productId })
      .andWhere('s.spec_category = :category', { category: dto.specCategory })
      .getRawOne<{ max: number | null }>();

    return this.specifications.save(
      this.specifications.create({
        id: randomUUID(),
        productId,
        specificationKey: dto.specificationKey.trim(),
        specificationValue: dto.specificationValue.trim(),
        unit: dto.unit?.trim() || null,
        specCategory: dto.specCategory,
        displayOrder: dto.displayOrder ?? Number(maxOrder?.max ?? -1) + 1,
      }),
    );
  }

  async updateSpecification(
    productId: string,
    specId: string,
    dto: ManageProductSpecificationDto,
  ): Promise<ProductSpecificationEntity> {
    const spec = await this.specifications.findOne({ where: { id: specId, productId } });
    if (!spec) throw new NotFoundException('مشخصات پیدا نشد.');
    spec.specificationKey = dto.specificationKey.trim();
    spec.specificationValue = dto.specificationValue.trim();
    spec.unit = dto.unit?.trim() || null;
    spec.specCategory = dto.specCategory;
    if (dto.displayOrder !== undefined) spec.displayOrder = dto.displayOrder;
    return this.specifications.save(spec);
  }

  async removeSpecification(productId: string, specId: string): Promise<void> {
    const spec = await this.specifications.findOne({ where: { id: specId, productId } });
    if (!spec) throw new NotFoundException('مشخصات پیدا نشد.');
    await this.specifications.remove(spec);
  }

  async reorderSpecifications(
    productId: string,
    dto: ReorderProductSpecificationsDto,
  ): Promise<ProductSpecificationEntity[]> {
    await this.assertProductExists(productId);
    const specs = await this.specifications.find({ where: { productId, id: In(dto.orderedIds) } });
    if (specs.length !== dto.orderedIds.length) {
      throw new NotFoundException('برخی مشخصات پیدا نشد.');
    }
    const byId = new Map(specs.map((item) => [item.id, item]));
    for (let index = 0; index < dto.orderedIds.length; index += 1) {
      const item = byId.get(dto.orderedIds[index]);
      if (item) item.displayOrder = index;
    }
    await this.specifications.save(specs);
    return this.findSpecifications(productId);
  }

  async copySpecifications(
    targetProductId: string,
    dto: CopyProductSpecsDto,
  ): Promise<ProductSpecificationEntity[]> {
    if (dto.sourceProductId === targetProductId) {
      throw new ConflictException('محصول مبدأ و مقصد نمی‌توانند یکسان باشند.');
    }
    await this.assertProductExists(targetProductId);
    await this.assertProductExists(dto.sourceProductId);

    const categories = Array.from(new Set(dto.categories)) as ProductSpecCategory[];
    const sourceSpecs = await this.specifications.find({
      where: { productId: dto.sourceProductId, specCategory: In(categories) },
      order: { displayOrder: 'ASC' },
    });

    const existing = await this.specifications.find({
      where: { productId: targetProductId, specCategory: In(categories) },
    });
    if (existing.length) await this.specifications.remove(existing);

    if (sourceSpecs.length) {
      await this.specifications.save(
        sourceSpecs.map((item, index) =>
          this.specifications.create({
            id: randomUUID(),
            productId: targetProductId,
            specificationKey: item.specificationKey,
            specificationValue: item.specificationValue,
            unit: item.unit,
            specCategory: item.specCategory,
            displayOrder: index,
          }),
        ),
      );
    }

    return this.findSpecifications(targetProductId);
  }

  async createVariant(productId: string, dto: ManageProductVariantDto, actor?: AuditActor): Promise<ProductVariantEntity> {
    const product = await this.assertProductExists(productId);
    const skuVariant = dto.skuVariant.trim().toUpperCase();
    const existing = await this.variants.findOne({ where: { skuVariant }, withDeleted: true });
    if (existing) throw new ConflictException('کد مدل از قبل وجود دارد.');

    const saved = await this.variants.save(
      this.variants.create({
        id: randomUUID(),
        productId,
        skuVariant,
        variantNameFa: dto.variantNameFa.trim(),
        variantNameEn: dto.variantNameEn.trim(),
        variantCode: dto.variantCode?.trim() || null,
        specifications: {},
        priceBase: dto.priceBase ?? product.priceBase,
        priceAdjustment: dto.priceAdjustment ?? 0,
        currency: 'IRR',
        stockQuantity: dto.stockQuantity ?? 0,
        isActive: dto.isActive ?? true,
      }),
    );
    if (actor) await AuditService.record(this.variants.manager, actor, 'product.variant_created', 'product_variant', saved.id, null, { priceBase: saved.priceBase, priceAdjustment: saved.priceAdjustment });
    return saved;
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: ManageProductVariantDto, actor?: AuditActor,
  ): Promise<ProductVariantEntity> {
    const variant = await this.variants.findOne({ where: { id: variantId, productId } });
    if (!variant) throw new NotFoundException('مدل پیدا نشد.');

    const skuVariant = dto.skuVariant.trim().toUpperCase();
    const duplicate = await this.variants.findOne({ where: { skuVariant }, withDeleted: true });
    if (duplicate && duplicate.id !== variantId) throw new ConflictException('کد مدل از قبل وجود دارد.');

    variant.skuVariant = skuVariant;
    variant.variantNameFa = dto.variantNameFa.trim();
    variant.variantNameEn = dto.variantNameEn.trim();
    variant.variantCode = dto.variantCode?.trim() || null;
    const previousPrice = variant.priceBase;
    if (dto.priceBase !== undefined) variant.priceBase = dto.priceBase;
    if (dto.priceAdjustment !== undefined) variant.priceAdjustment = dto.priceAdjustment;
    if (dto.stockQuantity !== undefined) variant.stockQuantity = dto.stockQuantity;
    if (dto.isActive !== undefined) variant.isActive = dto.isActive;

    const saved = await this.variants.save(variant);
    if (actor && (previousPrice !== saved.priceBase)) await AuditService.record(this.variants.manager, actor, 'product.variant_price_changed', 'product_variant', variantId, { priceBase: previousPrice }, { priceBase: saved.priceBase });
    return saved;
  }

  async removeVariant(productId: string, variantId: string): Promise<void> {
    const variant = await this.variants.findOne({ where: { id: variantId, productId } });
    if (!variant) throw new NotFoundException('مدل پیدا نشد.');
    await this.variants.softRemove(variant);
  }

  private slugifyPartNumber(partNumber: string): string {
    return partNumber
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 160);
  }

  private normalizeSpecs(specs: ManageSparePartDto['specs']): SparePartSpec[] {
    if (!specs?.length) return [];
    return specs
      .map((item) => ({
        key: item.key.trim(),
        value: item.value.trim(),
        unit: item.unit?.trim() || undefined,
      }))
      .filter((item) => item.key && item.value);
  }

  private async ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base || `part-${Date.now().toString(36)}`;
    let attempt = 0;
    while (true) {
      const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
      const existing = await this.spareParts.findOne({ where: { slug: candidate } });
      if (!existing || existing.id === excludeId) return candidate;
      attempt += 1;
    }
  }

  async findSpareParts(filters?: {
    q?: string;
    category?: string;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<SparePartEntity[]> {
    const qb = this.spareParts
      .createQueryBuilder('part')
      .where('part.is_active = :active', { active: true })
      .orderBy('part.created_at', 'ASC');

    if (filters?.category?.trim()) {
      qb.andWhere('part.category = :category', { category: filters.category.trim() });
    }
    if (filters?.inStock) {
      qb.andWhere('part.stock_quantity > 0');
    }
    if (filters?.minPrice != null && !Number.isNaN(filters.minPrice)) {
      qb.andWhere('part.price >= :minPrice', { minPrice: filters.minPrice });
      qb.andWhere('part.price_negotiable = :negFalse', { negFalse: false });
    }
    if (filters?.maxPrice != null && !Number.isNaN(filters.maxPrice)) {
      qb.andWhere('part.price <= :maxPrice', { maxPrice: filters.maxPrice });
      qb.andWhere('part.price_negotiable = :negFalse2', { negFalse2: false });
    }
    if (filters?.q?.trim()) {
      const q = `%${filters.q.trim()}%`;
      qb.andWhere(
        '(part.name_fa LIKE :q OR part.name_en LIKE :q OR part.part_number LIKE :q OR part.oem_code LIKE :q OR part.description LIKE :q)',
        { q },
      );
    }

    return qb.getMany();
  }

  findSparePartsForAdmin(): Promise<SparePartEntity[]> {
    return this.spareParts.find({ order: { createdAt: 'DESC' } });
  }

  async findSparePartPublic(slugOrId: string): Promise<SparePartEntity> {
    const part = await this.spareParts.findOne({
      where: [
        { id: slugOrId, isActive: true },
        { slug: slugOrId, isActive: true },
        { partNumber: slugOrId.toUpperCase(), isActive: true },
      ],
    });
    if (!part) throw new NotFoundException('قطعه پیدا نشد.');
    return part;
  }

  async findSparePartForAdmin(id: string): Promise<SparePartEntity> {
    const part = await this.spareParts.findOne({ where: { id } });
    if (!part) throw new NotFoundException('قطعه پیدا نشد.');
    return part;
  }

  async createSparePart(dto: ManageSparePartDto): Promise<SparePartEntity> {
    const partNumber = dto.partNumber.trim().toUpperCase();
    const existing = await this.spareParts.findOne({ where: { partNumber } });
    if (existing) throw new ConflictException('شماره قطعه از قبل وجود دارد.');

    const gallery = normalizeMediaList(dto.gallery);
    const imageUrl = toRelativeMediaPath(dto.imageUrl) || gallery[0] || null;
    const slug = await this.ensureUniqueSlug(
      (dto.slug?.trim() || this.slugifyPartNumber(partNumber)).toLowerCase(),
    );

    return this.spareParts.save(
      this.spareParts.create({
        id: randomUUID(),
        partNumber,
        slug,
        nameFa: dto.nameFa.trim(),
        nameEn: dto.nameEn.trim(),
        description: dto.description.trim(),
        shortDescription: dto.shortDescription?.trim() || null,
        category: dto.category.trim(),
        compatibleProducts: (dto.compatibleProducts ?? []).map((id) => id.trim()).filter(Boolean),
        price: dto.price,
        priceNegotiable: dto.priceNegotiable ?? false,
        currency: 'IRR',
        stockQuantity: dto.stockQuantity ?? 0,
        reorderLevel: dto.reorderLevel ?? 5,
        imageUrl,
        gallery,
        brand: dto.brand?.trim() || null,
        oemCode: dto.oemCode?.trim() || null,
        weightGrams: dto.weightGrams ?? null,
        dimensions: dto.dimensions?.trim() || null,
        specs: this.normalizeSpecs(dto.specs),
        warrantyMonths: dto.warrantyMonths ?? 12,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async updateSparePart(id: string, dto: PatchSparePartDto): Promise<SparePartEntity> {
    const part = await this.spareParts.findOne({ where: { id } });
    if (!part) throw new NotFoundException('قطعه پیدا نشد.');

    if (dto.partNumber !== undefined) {
      const partNumber = dto.partNumber.trim().toUpperCase();
      const duplicate = await this.spareParts.findOne({ where: { partNumber } });
      if (duplicate && duplicate.id !== id) throw new ConflictException('شماره قطعه از قبل وجود دارد.');
      part.partNumber = partNumber;
      if (dto.slug === undefined && !part.slug) {
        part.slug = await this.ensureUniqueSlug(this.slugifyPartNumber(partNumber), id);
      }
    }
    if (dto.slug !== undefined) {
      part.slug = await this.ensureUniqueSlug(dto.slug.trim().toLowerCase() || this.slugifyPartNumber(part.partNumber), id);
    }
    if (dto.nameFa !== undefined) part.nameFa = dto.nameFa.trim();
    if (dto.nameEn !== undefined) part.nameEn = dto.nameEn.trim();
    if (dto.description !== undefined) part.description = dto.description.trim();
    if (dto.shortDescription !== undefined) part.shortDescription = dto.shortDescription.trim() || null;
    if (dto.category !== undefined) part.category = dto.category.trim();
    if (dto.compatibleProducts !== undefined) {
      part.compatibleProducts = dto.compatibleProducts.map((value) => value.trim()).filter(Boolean);
    }
    if (dto.price !== undefined) part.price = dto.price;
    if (dto.priceNegotiable !== undefined) part.priceNegotiable = dto.priceNegotiable;
    if (dto.stockQuantity !== undefined) part.stockQuantity = dto.stockQuantity;
    if (dto.reorderLevel !== undefined) part.reorderLevel = dto.reorderLevel;
    if (dto.imageUrl !== undefined) part.imageUrl = toRelativeMediaPath(dto.imageUrl) || null;
    if (dto.gallery !== undefined) {
      part.gallery = normalizeMediaList(dto.gallery);
      if (!part.imageUrl && part.gallery[0]) part.imageUrl = part.gallery[0];
    }
    if (dto.brand !== undefined) part.brand = dto.brand.trim() || null;
    if (dto.oemCode !== undefined) part.oemCode = dto.oemCode.trim() || null;
    if (dto.weightGrams !== undefined) part.weightGrams = dto.weightGrams;
    if (dto.dimensions !== undefined) part.dimensions = dto.dimensions.trim() || null;
    if (dto.specs !== undefined) part.specs = this.normalizeSpecs(dto.specs);
    if (dto.warrantyMonths !== undefined) part.warrantyMonths = dto.warrantyMonths;
    if (dto.isActive !== undefined) part.isActive = dto.isActive;
    if (!part.slug) {
      part.slug = await this.ensureUniqueSlug(this.slugifyPartNumber(part.partNumber), id);
    }

    return this.spareParts.save(part);
  }

  async removeSparePart(id: string): Promise<void> {
    const part = await this.spareParts.findOne({ where: { id } });
    if (!part) throw new NotFoundException('قطعه پیدا نشد.');
    await this.spareParts.softRemove(part);
  }
}
