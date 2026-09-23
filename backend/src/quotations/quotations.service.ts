import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { In, Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CustomerEntity } from '../customers/customer.entity';
import { ProductEntity } from '../products/product.entity';
import { RequestQuotationDto } from './dto/request-quotation.dto';
import { QuotationEntity, QuotationItem } from './quotation.entity';
import { AuditActor, AuditService } from '../audit/audit.service';
import { OrderEntity } from '../orders/order.entity';

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

    if (dto.items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 999)) {
      throw new BadRequestException('تعداد هر محصول باید عدد صحیح بین ۱ و ۹۹۹ باشد.');
    }
    const cleanedItems = dto.items;
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
      quotationNumber: `QT-${randomUUID()}`,
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

    return this.quotations.manager.transaction(async manager => {
      const saved = await manager.getRepository(QuotationEntity).save(quotation);
      await AuditService.record(manager, user, 'quotation.created', 'quotation', saved.id, null, { status: saved.status, totalAmount: saved.totalAmount });
      return saved;
    });
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
    return this.quotations.manager.transaction(async manager => {
    const customer = await manager.getRepository(CustomerEntity).findOne({ where: { userId: user.userId } });
    const quotation = await manager.getRepository(QuotationEntity).findOne({ where: { id: quotationId },
      ...(manager.connection.options.type === 'postgres' ? { lock: { mode: 'pessimistic_write' as const } } : {}) });
    if (!customer || !quotation || quotation.customerId !== customer.id) {
      throw new NotFoundException('پیش‌فاکتور پیدا نشد.');
    }
    if (quotation.status !== 'sent' || await manager.getRepository(OrderEntity).existsBy({ referenceQuotationId: quotationId })) {
      throw new ConflictException('این پیش‌فاکتور دیگر قابل پذیرش نیست.');
    }
    if (new Date(quotation.validUntil).getTime() <= Date.now()) throw new ConflictException('اعتبار این پیش‌فاکتور به پایان رسیده است.');
    quotation.status = 'accepted';
    quotation.acceptedAt = new Date().toISOString();
    quotation.acceptedBy = user.userId;
    const saved = await manager.getRepository(QuotationEntity).save(quotation);
    await AuditService.record(manager, user, 'quotation.accepted', 'quotation', saved.id, { status: 'sent' },
      { status: saved.status, acceptedAt: saved.acceptedAt, acceptedBy: saved.acceptedBy });
    return saved;
    });
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

  async updateStatus(id: string, status: QuotationEntity['status'], actor: AuditActor): Promise<QuotationAdminView> {
    return this.quotations.manager.transaction(async manager => {
    const quotation = await manager.getRepository(QuotationEntity).findOne({ where: { id },
      ...(manager.connection.options.type === 'postgres' ? { lock: { mode: 'pessimistic_write' as const } } : {}) });
    if (!quotation) throw new NotFoundException('پیش‌فاکتور پیدا نشد.');

    const allowed: QuotationEntity['status'][] = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    if (!allowed.includes(status)) {
      throw new BadRequestException('وضعیت انتخاب‌شده معتبر نیست.');
    }

    const transitions: Record<string, string[]> = { draft: ['sent', 'rejected', 'expired'], sent: ['rejected', 'expired'], accepted: [], rejected: [], expired: [] };
    if (!(transitions[quotation.status] ?? []).includes(status)) throw new ConflictException('این تغییر وضعیت مجاز نیست؛ پذیرش باید توسط مشتری انجام شود.');
    if (status === 'sent' && new Date(quotation.validUntil).getTime() <= Date.now()) throw new ConflictException('اعتبار پیش‌فاکتور به پایان رسیده است.');
    const previous = quotation.status;
    quotation.status = status;
    const saved = await manager.getRepository(QuotationEntity).save(quotation);
    await AuditService.record(manager, actor, 'quotation.status_changed', 'quotation', id, { status: previous }, { status });
    const customer = await manager.getRepository(CustomerEntity).findOne({ where: { id: saved.customerId } });

    return Object.assign(saved, {
      customerCompanyName: customer?.companyName ?? null,
      customerContactPerson: customer?.contactPerson ?? null,
      customerPhone: customer?.phone ?? null,
    });
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
