import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { In, Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CustomerEntity } from '../customers/customer.entity';
import { ProductEntity } from '../products/product.entity';
import { RequestQuotationDto } from './dto/request-quotation.dto';
import { QuotationEntity, QuotationItem } from './quotation.entity';

export type QuotationAdminView = QuotationEntity & {
  customerCompanyName: string | null;
  customerContactPerson: string | null;
  customerPhone: string | null;
};

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(QuotationEntity) private readonly quotations: Repository<QuotationEntity>,
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
  ) {}

  async request(user: AuthUser, dto: RequestQuotationDto): Promise<QuotationEntity> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    if (!customer) {
      throw new NotFoundException('پروفایل مشتری پیدا نشد. لطفاً دوباره وارد شوید یا ثبت‌نام کنید.');
    }

    const cleanedItems = dto.items.filter((item) => item.quantity > 0);
    if (cleanedItems.length === 0) {
      throw new BadRequestException('حداقل یک محصول با تعداد بیشتر از صفر انتخاب کنید.');
    }

    const productIds = [...new Set(cleanedItems.map((item) => item.productId))];
    const products = await this.products.find({ where: { id: In(productIds), isActive: true } });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const items: QuotationItem[] = [];
    for (const requestedItem of cleanedItems) {
      const product = productMap.get(requestedItem.productId);
      if (!product) {
        throw new NotFoundException('یکی از محصولات انتخاب‌شده پیدا نشد یا غیرفعال است.');
      }
      items.push({
        productId: product.id,
        productName: product.nameFa,
        quantity: requestedItem.quantity,
        unitPrice: product.priceBase,
        lineTotal: product.priceBase * requestedItem.quantity,
        customizations: requestedItem.customizations ?? {},
      });
    }

    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const quotation = this.quotations.create({
      id: randomUUID(),
      quotationNumber: `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      customerId: customer.id,
      quotedBy: null,
      validUntil,
      items,
      subtotal,
      taxAmount: 0,
      taxRate: 0,
      discountAmount: 0,
      totalAmount: subtotal,
      currency: 'IRR',
      status: 'draft',
      notes: this.buildNotes(dto, customer),
    });

    return this.quotations.save(quotation);
  }

  findMine(user: AuthUser): Promise<QuotationEntity[]> {
    return this.customers
      .findOne({ where: { userId: user.userId } })
      .then((customer) =>
        customer
          ? this.quotations.find({ where: { customerId: customer.id }, order: { createdAt: 'DESC' } })
          : [],
      );
  }

  async accept(user: AuthUser, quotationId: string): Promise<QuotationEntity> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    const quotation = await this.quotations.findOne({ where: { id: quotationId } });
    if (!customer || !quotation || quotation.customerId !== customer.id) {
      throw new NotFoundException('پیش‌فاکتور پیدا نشد.');
    }
    if (quotation.status !== 'draft' && quotation.status !== 'sent') {
      throw new ConflictException('این پیش‌فاکتور دیگر قابل پذیرش نیست.');
    }
    quotation.status = 'accepted';
    return this.quotations.save(quotation);
  }

  async findAll(): Promise<QuotationAdminView[]> {
    const quotations = await this.quotations.find({ order: { createdAt: 'DESC' } });
    if (quotations.length === 0) return [];

    const customerIds = [...new Set(quotations.map((item) => item.customerId))];
    const customers = await this.customers.find({ where: { id: In(customerIds) } });
    const customerMap = new Map(customers.map((customer) => [customer.id, customer]));

    return quotations.map((quotation) => {
      const customer = customerMap.get(quotation.customerId);
      return Object.assign(quotation, {
        customerCompanyName: customer?.companyName ?? null,
        customerContactPerson: customer?.contactPerson ?? null,
        customerPhone: customer?.phone ?? null,
      });
    });
  }

  async updateStatus(id: string, status: QuotationEntity['status']): Promise<QuotationAdminView> {
    const quotation = await this.quotations.findOne({ where: { id } });
    if (!quotation) throw new NotFoundException('پیش‌فاکتور پیدا نشد.');

    const allowed: QuotationEntity['status'][] = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    if (!allowed.includes(status)) {
      throw new BadRequestException('وضعیت انتخاب‌شده معتبر نیست.');
    }

    quotation.status = status;
    const saved = await this.quotations.save(quotation);
    const customer = await this.customers.findOne({ where: { id: saved.customerId } });

    return Object.assign(saved, {
      customerCompanyName: customer?.companyName ?? null,
      customerContactPerson: customer?.contactPerson ?? null,
      customerPhone: customer?.phone ?? null,
    });
  }

  private buildNotes(dto: RequestQuotationDto, customer: CustomerEntity): string | null {
    const lines: string[] = [];

    if (dto.projectCity?.trim()) lines.push(`محل پروژه: ${dto.projectCity.trim()}`);
    if (dto.contactPhone?.trim()) lines.push(`تماس پیگیری: ${dto.contactPhone.trim()}`);
    else if (customer.phone) lines.push(`تماس پیگیری: ${customer.phone}`);
    if (dto.venueDetails?.trim()) lines.push(`جزئیات فضا/سالن: ${dto.venueDetails.trim()}`);
    if (dto.notes?.trim()) {
      if (lines.length) lines.push('---');
      lines.push(dto.notes.trim());
    }

    return lines.length ? lines.join('\n') : null;
  }
}
