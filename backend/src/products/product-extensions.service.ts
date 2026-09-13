import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { In, Repository } from 'typeorm';
import { ProductEntity } from './product.entity';
import { ProductVariantEntity } from './product-variant.entity';
import { ProductSpecificationEntity } from './product-specification.entity';
import { SparePartEntity } from './spare-part.entity';
import { ManageSparePartDto } from './dto/manage-spare-part.dto';
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
          nameEn: 'Drive Motor A',
          nameFa: 'موتور محرک سری A',
          description: 'موتور یدکی سازگار با تجهیزات MIG.',
          category: 'motors',
          compatibleProducts: ['1', '2'],
          price: 3500000,
          currency: 'IRR',
          stockQuantity: 24,
          reorderLevel: 5,
          imageUrl: null,
          warrantyMonths: 12,
          isActive: true,
        },
        {
          id: randomUUID(),
          partNumber: 'MIG-SP-BATTERY-L',
          nameEn: 'Lithium Battery Pack',
          nameFa: 'پک باتری لیتیومی',
          description: 'پک باتری قابل شارژ برای استفاده مداوم.',
          category: 'electrical',
          compatibleProducts: ['1', '2'],
          price: 2500000,
          currency: 'IRR',
          stockQuantity: 15,
          reorderLevel: 5,
          imageUrl: null,
          warrantyMonths: 12,
          isActive: true,
        },
      ]);
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

  async createVariant(productId: string, dto: ManageProductVariantDto): Promise<ProductVariantEntity> {
    const product = await this.assertProductExists(productId);
    const skuVariant = dto.skuVariant.trim().toUpperCase();
    const existing = await this.variants.findOne({ where: { skuVariant }, withDeleted: true });
    if (existing) throw new ConflictException('کد مدل از قبل وجود دارد.');

    return this.variants.save(
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
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: ManageProductVariantDto,
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
    if (dto.priceBase !== undefined) variant.priceBase = dto.priceBase;
    if (dto.priceAdjustment !== undefined) variant.priceAdjustment = dto.priceAdjustment;
    if (dto.stockQuantity !== undefined) variant.stockQuantity = dto.stockQuantity;
    if (dto.isActive !== undefined) variant.isActive = dto.isActive;

    return this.variants.save(variant);
  }

  async removeVariant(productId: string, variantId: string): Promise<void> {
    const variant = await this.variants.findOne({ where: { id: variantId, productId } });
    if (!variant) throw new NotFoundException('مدل پیدا نشد.');
    await this.variants.softRemove(variant);
  }

  findSpareParts(): Promise<SparePartEntity[]> {
    return this.spareParts.find({ where: { isActive: true }, order: { createdAt: 'ASC' } });
  }

  findSparePartsForAdmin(): Promise<SparePartEntity[]> {
    return this.spareParts.find({ order: { createdAt: 'DESC' } });
  }

  async createSparePart(dto: ManageSparePartDto): Promise<SparePartEntity> {
    const partNumber = dto.partNumber.trim().toUpperCase();
    const existing = await this.spareParts.findOne({ where: { partNumber } });
    if (existing) throw new ConflictException('شماره قطعه از قبل وجود دارد.');

    return this.spareParts.save(
      this.spareParts.create({
        id: randomUUID(),
        partNumber,
        nameFa: dto.nameFa.trim(),
        nameEn: dto.nameEn.trim(),
        description: dto.description.trim(),
        category: dto.category.trim(),
        compatibleProducts: (dto.compatibleProducts ?? []).map((id) => id.trim()).filter(Boolean),
        price: dto.price,
        currency: 'IRR',
        stockQuantity: dto.stockQuantity ?? 0,
        reorderLevel: dto.reorderLevel ?? 5,
        imageUrl: dto.imageUrl?.trim() || null,
        warrantyMonths: dto.warrantyMonths ?? 12,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async updateSparePart(id: string, dto: ManageSparePartDto): Promise<SparePartEntity> {
    const part = await this.spareParts.findOne({ where: { id } });
    if (!part) throw new NotFoundException('قطعه پیدا نشد.');

    const partNumber = dto.partNumber.trim().toUpperCase();
    const duplicate = await this.spareParts.findOne({ where: { partNumber } });
    if (duplicate && duplicate.id !== id) throw new ConflictException('شماره قطعه از قبل وجود دارد.');

    part.partNumber = partNumber;
    part.nameFa = dto.nameFa.trim();
    part.nameEn = dto.nameEn.trim();
    part.description = dto.description.trim();
    part.category = dto.category.trim();
    part.compatibleProducts = (dto.compatibleProducts ?? []).map((value) => value.trim()).filter(Boolean);
    part.price = dto.price;
    if (dto.stockQuantity !== undefined) part.stockQuantity = dto.stockQuantity;
    if (dto.reorderLevel !== undefined) part.reorderLevel = dto.reorderLevel;
    if (dto.imageUrl !== undefined) part.imageUrl = dto.imageUrl.trim() || null;
    if (dto.warrantyMonths !== undefined) part.warrantyMonths = dto.warrantyMonths;
    if (dto.isActive !== undefined) part.isActive = dto.isActive;

    return this.spareParts.save(part);
  }

  async removeSparePart(id: string): Promise<void> {
    const part = await this.spareParts.findOne({ where: { id } });
    if (!part) throw new NotFoundException('قطعه پیدا نشد.');
    await this.spareParts.softRemove(part);
  }
}
