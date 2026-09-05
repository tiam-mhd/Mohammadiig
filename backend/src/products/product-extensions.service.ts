import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { ProductEntity } from './product.entity';
import { ProductVariantEntity } from './product-variant.entity';
import { ProductSpecificationEntity } from './product-specification.entity';
import { SparePartEntity } from './spare-part.entity';

@Injectable()
export class ProductExtensionsService implements OnModuleInit {
  constructor(@InjectRepository(ProductVariantEntity) private readonly variants: Repository<ProductVariantEntity>, @InjectRepository(ProductSpecificationEntity) private readonly specifications: Repository<ProductSpecificationEntity>, @InjectRepository(SparePartEntity) private readonly spareParts: Repository<SparePartEntity>, @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>) {}

  async onModuleInit(): Promise<void> {
    const [signature, junior] = await Promise.all([this.products.findOne({ where: { id: '1' } }), this.products.findOne({ where: { id: '2' } })]);
    if ((await this.variants.count()) === 0 && signature && junior) await this.variants.save([
      { id: randomUUID(), productId: signature.id, skuVariant: 'MIG-BC-SIG-STD', variantNameEn: 'Signature Standard', variantNameFa: 'Signature استاندارد', variantCode: 'STD', specifications: { seats: 1 }, priceBase: signature.priceBase, priceAdjustment: 0, currency: 'IRR', stockQuantity: 8, isActive: true },
      { id: randomUUID(), productId: signature.id, skuVariant: 'MIG-BC-SIG-PRO', variantNameEn: 'Signature Pro', variantNameFa: 'Signature حرفه‌ای', variantCode: 'PRO', specifications: { seats: 2 }, priceBase: signature.priceBase, priceAdjustment: 7500000, currency: 'IRR', stockQuantity: 3, isActive: true },
      { id: randomUUID(), productId: junior.id, skuVariant: 'MIG-JUNIOR-RED', variantNameEn: 'Junior Red', variantNameFa: 'Junior قرمز', variantCode: 'RED', specifications: { color: 'red' }, priceBase: junior.priceBase, priceAdjustment: 0, currency: 'IRR', stockQuantity: 12, isActive: true },
    ]);
    if ((await this.specifications.count()) === 0 && signature && junior) await this.specifications.save([
      { id: randomUUID(), productId: signature.id, specificationKey: 'power', specificationValue: 'Electric', unit: null, specCategory: 'Engine', displayOrder: 1 },
      { id: randomUUID(), productId: signature.id, specificationKey: 'audience', specificationValue: 'Adult', unit: null, specCategory: 'Usage', displayOrder: 2 },
      { id: randomUUID(), productId: junior.id, specificationKey: 'audience', specificationValue: 'Family', unit: null, specCategory: 'Usage', displayOrder: 1 },
    ]);
    if ((await this.spareParts.count()) === 0) await this.spareParts.save([{ id: randomUUID(), partNumber: 'MIG-SP-MOTOR-A', nameEn: 'Drive Motor A', nameFa: 'موتور محرک سری A', description: 'موتور یدکی سازگار با تجهیزات MIG.', compatibleProducts: ['1', '2'], price: 3500000, currency: 'IRR', stockQuantity: 24, reorderLevel: 5, imageUrl: null, warrantyMonths: 12, isActive: true }, { id: randomUUID(), partNumber: 'MIG-SP-BATTERY-L', nameEn: 'Lithium Battery Pack', nameFa: 'پک باتری لیتیومی', description: 'پک باتری قابل شارژ برای استفاده مداوم.', compatibleProducts: ['1', '2'], price: 2500000, currency: 'IRR', stockQuantity: 15, reorderLevel: 5, imageUrl: null, warrantyMonths: 12, isActive: true }]);
  }

  findVariants(productId: string): Promise<ProductVariantEntity[]> { return this.variants.find({ where: { productId, isActive: true }, order: { createdAt: 'ASC' } }); }
  findSpecifications(productId: string): Promise<ProductSpecificationEntity[]> { return this.specifications.find({ where: { productId }, order: { displayOrder: 'ASC' } }); }
  findSpareParts(): Promise<SparePartEntity[]> { return this.spareParts.find({ where: { isActive: true }, order: { createdAt: 'ASC' } }); }
}
