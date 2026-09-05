import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CustomerEntity } from '../customers/customer.entity';
import { ProductEntity } from '../products/product.entity';
import { RequestQuotationDto } from './dto/request-quotation.dto';
import { QuotationEntity, QuotationItem } from './quotation.entity';

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(QuotationEntity) private readonly quotations: Repository<QuotationEntity>,
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
  ) {}

  async request(user: AuthUser, dto: RequestQuotationDto): Promise<QuotationEntity> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    if (!customer) throw new NotFoundException('Customer profile not found');
    if (dto.items.length === 0) throw new NotFoundException('Quotation requires at least one product');

    const items: QuotationItem[] = [];
    for (const requestedItem of dto.items) {
      const product = await this.products.findOne({ where: { id: requestedItem.productId, isActive: true } });
      if (!product) throw new NotFoundException(`Product ${requestedItem.productId} not found`);
      items.push({ productId: product.id, productName: product.nameFa, quantity: requestedItem.quantity, unitPrice: product.priceBase, lineTotal: product.priceBase * requestedItem.quantity, customizations: requestedItem.customizations ?? {} });
    }

    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    const quotation = this.quotations.create({
      id: randomUUID(), quotationNumber: `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      customerId: customer.id, quotedBy: null, validUntil, items, subtotal, taxAmount: 0, taxRate: 0,
      discountAmount: 0, totalAmount: subtotal, currency: 'IRR', status: 'draft', notes: dto.notes ?? null,
    });
    return this.quotations.save(quotation);
  }

  findMine(user: AuthUser): Promise<QuotationEntity[]> {
    return this.customers.findOne({ where: { userId: user.userId } }).then((customer) => customer ? this.quotations.find({ where: { customerId: customer.id }, order: { createdAt: 'DESC' } }) : []);
  }

  async accept(user: AuthUser, quotationId: string): Promise<QuotationEntity> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    const quotation = await this.quotations.findOne({ where: { id: quotationId } });
    if (!customer || !quotation || quotation.customerId !== customer.id) throw new NotFoundException('Quotation not found');
    if (quotation.status !== 'draft' && quotation.status !== 'sent') throw new ConflictException('Quotation cannot be accepted');
    quotation.status = 'accepted';
    return this.quotations.save(quotation);
  }
}
