import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, In, Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { UserEntity } from '../auth/user.entity';
import { CustomerEntity } from '../customers/customer.entity';
import { ensureCustomerProfile } from '../customers/customer-profile';
import { QuotationEntity } from '../quotations/quotation.entity';
import { OrderEntity } from './order.entity';
import { OrderItemEntity } from './order-item.entity';
import { InvoiceEntity, InvoiceLineItem, InvoicePartySnapshot } from '../invoices/invoice.entity';
import { SparePartEntity } from '../products/spare-part.entity';
import { SparePartsCheckoutDto } from './dto/spare-parts-checkout.dto';
import { PaymentEntity } from '../payments/payment.entity';
import { OrderStatus, orderStatusTransitions } from './order-status';
import { AuditActor, AuditService } from '../audit/audit.service';

export type OrderDetail = OrderEntity & {
  items: OrderItemEntity[];
  invoice?: InvoiceEntity | null;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly orderItems: Repository<OrderItemEntity>,
    @InjectRepository(QuotationEntity) private readonly quotations: Repository<QuotationEntity>,
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
    @InjectRepository(InvoiceEntity) private readonly invoices: Repository<InvoiceEntity>,
    @InjectRepository(SparePartEntity) private readonly spareParts: Repository<SparePartEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private addressToRecord(address: SparePartsCheckoutDto['shippingAddress']): Record<string, string> {
    return {
      fullName: address.fullName,
      phone: address.phone,
      city: address.city,
      address: address.address,
      postalCode: address.postalCode ?? '',
      province: address.province ?? '',
    };
  }

  private async resolveCustomer(user: AuthUser): Promise<{ customer: CustomerEntity; userRow: UserEntity | null }> {
    const userRow = await this.users.findOne({ where: { id: user.userId } });
    const customer = await ensureCustomerProfile(this.customers, userRow);
    return { customer, userRow };
  }

  private buildCustomerSnapshot(customer: CustomerEntity, userRow: UserEntity | null): InvoicePartySnapshot {
    return {
      customerId: customer.id,
      userId: customer.userId,
      companyName: customer.companyName ?? userRow?.companyName ?? null,
      contactPerson:
        customer.contactPerson ??
        ([userRow?.firstName, userRow?.lastName].filter(Boolean).join(' ') || null),
      phone: customer.phone ?? userRow?.phone ?? null,
      email: userRow?.email ?? null,
      city: customer.city,
      country: customer.country,
      address: customer.address,
      industry: customer.industry,
      registrationNumber: customer.companyRegistrationNumber,
    };
  }

  async convertQuotation(user: AuthUser, quotationId: string): Promise<OrderEntity> {
    return this.dataSource.transaction(async (manager) => {
    const customer = await manager.getRepository(CustomerEntity).findOne({ where: { userId: user.userId } });
    const quotation = await manager.getRepository(QuotationEntity).findOne({
      where: { id: quotationId },
      ...(manager.connection.options.type === 'postgres' ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!customer || !quotation || quotation.customerId !== customer.id) throw new NotFoundException('پیش‌فاکتور یافت نشد.');
    const existingOrder = await manager.getRepository(OrderEntity).findOne({ where: { referenceQuotationId: quotation.id }, withDeleted: true });
    if (existingOrder) return existingOrder;
    if (quotation.status !== 'accepted') throw new ConflictException('پیش‌فاکتور باید پیش از تبدیل پذیرفته شده باشد.');

    const userRow = await manager.getRepository(UserEntity).findOne({ where: { id: user.userId } });
    const order = await manager.getRepository(OrderEntity).save({
      id: randomUUID(),
      orderNumber: `ORD-${randomUUID()}`,
      customerId: customer.id,
      createdBy: user.userId,
      status: 'pending',
      orderType: 'custom',
      shippingAddress: {},
      billingAddress: {},
      subtotal: quotation.subtotal,
      taxAmount: quotation.taxAmount,
      shippingCost: 0,
      discountAmount: quotation.discountAmount,
      totalAmount: quotation.totalAmount,
      currency: quotation.currency,
      paymentStatus: 'unpaid',
      referenceQuotationId: quotation.id,
      notes: quotation.notes,
    });
    const savedItems = await manager.getRepository(OrderItemEntity).save(
      quotation.items.map((item) => ({
        id: randomUUID(),
        orderId: order.id,
        productId: item.productId,
        itemType: 'product',
        sparePartId: null,
        titleSnapshot: item.productName,
        skuSnapshot: null,
        imageSnapshot: null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        currency: quotation.currency,
        customizationsJson: item.customizations,
        status: 'pending',
      })),
    );
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const lineItems: InvoiceLineItem[] = savedItems.map((item) => ({
      itemType: 'product',
      productId: item.productId,
      sparePartId: null,
      title: item.titleSnapshot || `محصول ${item.productId}`,
      sku: item.skuSnapshot || item.productId,
      imageUrl: item.imageSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      currency: item.currency,
    }));
    await manager.getRepository(InvoiceEntity).save({
      id: randomUUID(),
      invoiceNumber: `INV-${randomUUID()}`,
      orderId: order.id,
      quotationId: quotation.id,
      customerId: customer.id,
      dueDate,
      totalBeforeTax: order.subtotal,
      taxAmount: order.taxAmount,
      totalAfterTax: order.totalAmount,
      currency: order.currency,
      paymentStatus: 'pending',
      notes: order.notes,
      lineItemsJson: lineItems,
      customerSnapshotJson: this.buildCustomerSnapshot(customer, userRow),
      shippingSnapshotJson: {},
      billingSnapshotJson: {},
      paymentMethod: null,
      paidAt: null,
    });
    return order;
    });
  }

  async checkoutSpareParts(
    user: AuthUser,
    dto: SparePartsCheckoutDto,
  ): Promise<{ order: OrderEntity; invoice: InvoiceEntity; payment?: PaymentEntity | null }> {
    if (dto.payWithTestGateway && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('پرداخت آزمایشی در محیط عملیاتی مجاز نیست.');
    }
    const { customer, userRow } = await this.resolveCustomer(user);
    const qtyById = new Map<string, number>();
    for (const line of dto.items) {
      qtyById.set(line.sparePartId, (qtyById.get(line.sparePartId) ?? 0) + line.quantity);
    }
    if ([...qtyById.values()].some((quantity) => !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000)) {
      throw new BadRequestException('تعداد هر قطعه باید عدد صحیح بین ۱ و ۱۰۰۰ باشد.');
    }
    const partIds = [...qtyById.keys()];
    const parts = await this.spareParts.find({ where: { id: In(partIds), isActive: true } });
    if (parts.length !== partIds.length) {
      throw new BadRequestException('یک یا چند قطعه در کاتالوگ یافت نشد یا غیرفعال است.');
    }

    for (const part of parts) {
      const qty = qtyById.get(part.id) ?? 0;
      if (part.priceNegotiable) {
        throw new BadRequestException(
          `قیمت «${part.nameFa}» توافقی است و از مسیر استعلام ثبت می‌شود.`,
        );
      }
      if (part.stockQuantity < qty) {
        throw new ConflictException(`موجودی «${part.nameFa}» کافی نیست (موجود: ${part.stockQuantity}).`);
      }
    }

    const shipping = this.addressToRecord(dto.shippingAddress);
    const billing = dto.billingAddress
      ? this.addressToRecord(dto.billingAddress)
      : { ...shipping };

    const result = await this.dataSource.transaction(async (manager) => {
      const partsRepo = manager.getRepository(SparePartEntity);
      const ordersRepo = manager.getRepository(OrderEntity);
      const itemsRepo = manager.getRepository(OrderItemEntity);
      const invoicesRepo = manager.getRepository(InvoiceEntity);
      const paymentsRepo = manager.getRepository(PaymentEntity);

      // Re-lock stock inside transaction
      const partsQuery = partsRepo.createQueryBuilder('part').where('part.id IN (:...ids)', { ids: partIds }).orderBy('part.id', 'ASC');
      if (manager.connection.options.type === 'postgres') partsQuery.setLock('pessimistic_write');
      const lockedParts = await partsQuery.getMany();
      const lockedMap = new Map(lockedParts.map((p) => [p.id, p]));
      let subtotal = 0;
      const prepared: Array<{
        part: SparePartEntity;
        quantity: number;
        lineTotal: number;
      }> = [];

      for (const [id, quantity] of qtyById) {
        const part = lockedMap.get(id);
        if (!part || !part.isActive) throw new BadRequestException('قطعه نامعتبر است.');
        if (part.priceNegotiable || !Number.isSafeInteger(part.price) || part.price <= 0) {
          throw new BadRequestException('قیمت قطعه برای سفارش مستقیم معتبر نیست.');
        }
        if (part.stockQuantity < quantity) {
          throw new ConflictException(`موجودی «${part.nameFa}» کافی نیست.`);
        }
        const lineTotal = part.price * quantity;
        subtotal += lineTotal;
        prepared.push({ part, quantity, lineTotal });
        part.stockQuantity -= quantity;
        await partsRepo.save(part);
      }

      const taxAmount = 0;
      const shippingCost = 0;
      const discountAmount = 0;
      const totalAmount = subtotal + taxAmount + shippingCost - discountAmount;
      const year = new Date().getFullYear();
      const stamp = randomUUID();

      const order = await ordersRepo.save({
        id: randomUUID(),
        orderNumber: `SP-${year}-${stamp}`,
        customerId: customer.id,
        createdBy: user.userId,
        status: 'pending',
        orderType: 'spare_parts',
        shippingAddress: shipping,
        billingAddress: billing,
        subtotal,
        taxAmount,
        shippingCost,
        discountAmount,
        totalAmount,
        currency: 'IRR',
        paymentStatus: 'unpaid',
        referenceQuotationId: null,
        notes: dto.notes?.trim() || null,
      });

      const items = await itemsRepo.save(
        prepared.map(({ part, quantity, lineTotal }) => ({
          id: randomUUID(),
          orderId: order.id,
          productId: '',
          itemType: 'spare_part',
          sparePartId: part.id,
          titleSnapshot: part.nameFa,
          skuSnapshot: part.partNumber,
          imageSnapshot: part.imageUrl,
          quantity,
          unitPrice: part.price,
          lineTotal,
          currency: 'IRR',
          customizationsJson: {
            slug: part.slug ?? '',
            brand: part.brand ?? '',
            oemCode: part.oemCode ?? '',
            warrantyMonths: String(part.warrantyMonths),
          },
          status: 'pending',
        })),
      );

      const lineItems: InvoiceLineItem[] = items.map((item) => ({
        itemType: 'spare_part',
        sparePartId: item.sparePartId,
        productId: null,
        title: item.titleSnapshot || 'قطعه یدکی',
        sku: item.skuSnapshot || '',
        imageUrl: item.imageSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        currency: item.currency,
      }));

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const invoice = await invoicesRepo.save({
        id: randomUUID(),
        invoiceNumber: `INV-SP-${year}-${stamp}`,
        orderId: order.id,
        quotationId: null,
        customerId: customer.id,
        dueDate,
        totalBeforeTax: subtotal,
        taxAmount,
        totalAfterTax: totalAmount,
        currency: 'IRR',
        paymentStatus: 'pending',
        notes: dto.notes?.trim() || null,
        lineItemsJson: lineItems,
        customerSnapshotJson: this.buildCustomerSnapshot(customer, userRow),
        shippingSnapshotJson: shipping,
        billingSnapshotJson: billing,
        paymentMethod: null as string | null,
        paidAt: null as Date | null,
      });

      let payment: PaymentEntity | null = null;
      if (dto.payWithTestGateway) {
        payment = await paymentsRepo.save({
          id: randomUUID(),
          invoiceId: invoice.id,
          orderId: order.id,
          amount: totalAmount,
          currency: 'IRR',
          paymentMethod: 'test_gateway',
          transactionId: `TEST-${Date.now()}`,
          paymentStatus: 'completed',
          notes: 'پرداخت آزمایشی موفق (بدون درگاه واقعی)',
          processedBy: 'system:test-gateway',
        });
        invoice.paymentStatus = 'paid';
        invoice.paymentMethod = 'test_gateway';
        invoice.paidAt = new Date();
        await invoicesRepo.save(invoice);
        order.paymentStatus = 'paid';
        order.status = 'processing';
        await ordersRepo.save(order);
      }

      return { order, invoice, payment };
    });

    return result;
  }

  findMine(user: AuthUser): Promise<OrderEntity[]> {
    return this.customers.findOne({ where: { userId: user.userId } }).then((customer) =>
      customer ? this.orders.find({ where: { customerId: customer.id }, order: { createdAt: 'DESC' } }) : [],
    );
  }

  async findOneMine(user: AuthUser, idOrNumber: string): Promise<OrderDetail> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    const order = customer
      ? await this.orders.findOne({
          where: [
            { id: idOrNumber, customerId: customer.id },
            { orderNumber: idOrNumber, customerId: customer.id },
          ],
        })
      : null;
    if (!order) throw new NotFoundException('Order not found');
    const items = await this.orderItems.find({ where: { orderId: order.id }, order: { createdAt: 'ASC' } });
    const invoice = await this.invoices.findOne({ where: { orderId: order.id } });
    return Object.assign(order, { items, invoice });
  }

  async findAllDetailed(): Promise<OrderDetail[]> {
    const orders = await this.orders.find({ order: { createdAt: 'DESC' } });
    if (!orders.length) return [];
    const ids = orders.map((o) => o.id);
    const items = await this.orderItems.find({ where: { orderId: In(ids) } });
    const invoices = await this.invoices.find({ where: { orderId: In(ids) } });
    const itemsByOrder = new Map<string, OrderItemEntity[]>();
    for (const item of items) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }
    const invoiceByOrder = new Map(invoices.filter((i) => i.orderId).map((i) => [i.orderId!, i]));
    return orders.map((order) =>
      Object.assign(order, {
        items: itemsByOrder.get(order.id) ?? [],
        invoice: invoiceByOrder.get(order.id) ?? null,
      }),
    );
  }

  async findOneAdmin(id: string): Promise<OrderDetail> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    const items = await this.orderItems.find({ where: { orderId: order.id }, order: { createdAt: 'ASC' } });
    const invoice = await this.invoices.findOne({ where: { orderId: order.id } });
    return Object.assign(order, { items, invoice });
  }

  async findAll(page = 1, limit = 20, sort = 'createdAt', order: 'asc'|'desc' = 'desc') {
    const sortMap: Record<string, string> = { createdAt: 'createdAt', orderNumber: 'orderNumber', totalAmount: 'totalAmount', status: 'status' };
    const [data, total] = await this.orders.findAndCount({ order: { [sortMap[sort] ?? 'createdAt']: order.toUpperCase() as 'ASC'|'DESC' }, skip: (page - 1) * limit, take: limit });
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateStatus(id: string, status: OrderStatus, actor: AuditActor): Promise<OrderEntity> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException('سفارش یافت نشد.');
    if (order.status === status) return order;
    if (!orderStatusTransitions[order.status as OrderStatus]?.includes(status)) throw new BadRequestException('تغییر وضعیت سفارش مجاز نیست.');
    const previous = order.status;
    return this.orders.manager.transaction(async manager => {
      const locked = await manager.getRepository(OrderEntity).findOne({ where: { id }, ...(manager.connection.options.type === 'postgres' ? { lock: { mode: 'pessimistic_write' as const } } : {}) });
      if (!locked) throw new NotFoundException('سفارش یافت نشد.');
      if (locked.status !== previous || !orderStatusTransitions[locked.status as OrderStatus]?.includes(status)) throw new BadRequestException('این تغییر وضعیت دیگر مجاز نیست.');
      locked.status = status;
      const saved = await manager.getRepository(OrderEntity).save(locked);
      await AuditService.record(manager, actor, 'order.status_changed', 'order', id, { status: previous }, { status });
      return saved;
    });
  }
}
