import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CustomerEntity } from '../customers/customer.entity';
import { InvoiceEntity } from '../invoices/invoice.entity';
import { OrderEntity } from '../orders/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentEntity } from './payment.entity';
import { PaymentStatus } from './payment-status';
import { AuditActor, AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(InvoiceEntity) private readonly invoices: Repository<InvoiceEntity>,
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
  ) {}

  private async markPaid(invoice: InvoiceEntity, paymentMethod: string): Promise<void> {
    invoice.paymentStatus = 'paid';
    invoice.paymentMethod = paymentMethod;
    invoice.paidAt = new Date();
    await this.invoices.save(invoice);
    if (invoice.orderId) {
      const order = await this.orders.findOne({ where: { id: invoice.orderId } });
      if (order) {
        order.paymentStatus = 'paid';
        if (order.status === 'pending') order.status = 'processing';
        await this.orders.save(order);
      }
    }
  }

  async create(user: AuthUser & AuditActor, invoiceId: string, dto: CreatePaymentDto): Promise<PaymentEntity> {
    if (!Number.isSafeInteger(dto.amount) || dto.amount <= 0 || dto.amount > 2147483647) {
      throw new BadRequestException('مبلغ پرداخت باید عدد صحیح مثبت و در محدوده مجاز باشد.');
    }
    if (dto.paymentMethod === 'test_gateway' && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('پرداخت آزمایشی در محیط عملیاتی مجاز نیست.');
    }
    return this.payments.manager.transaction(async (manager) => {
    const customer = await manager.getRepository(CustomerEntity).findOne({ where: { userId: user.userId } });
    const invoice = await manager.getRepository(InvoiceEntity).findOne({
      where: { id: invoiceId },
      ...(manager.connection.options.type === 'postgres' ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!customer || !invoice || invoice.customerId !== customer.id) throw new NotFoundException('فاکتور یافت نشد.');
    if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'cancelled') throw new ConflictException('این فاکتور قابل پرداخت نیست.');
    const payments = manager.getRepository(PaymentEntity);
    if (await payments.existsBy({ invoiceId, paymentStatus: PaymentStatus.Pending })) {
      throw new ConflictException('یک پرداخت در انتظار بررسی برای این فاکتور وجود دارد.');
    }
    const paid = await payments.sum('amount', { invoiceId, paymentStatus: PaymentStatus.Completed }) ?? 0;
    if (dto.amount > invoice.totalAfterTax - paid) throw new ConflictException('مبلغ پرداخت بیشتر از مانده فاکتور است.');
    const transactionId = dto.transactionId?.trim() || null;
    if (transactionId && await payments.existsBy({ transactionId })) throw new ConflictException('شناسه تراکنش قبلاً ثبت شده است.');
    const payment = await payments.save({
      id: randomUUID(),
      invoiceId,
      orderId: invoice.orderId,
      amount: dto.amount,
      currency: invoice.currency,
      paymentMethod: dto.paymentMethod,
      transactionId,
      paymentStatus: PaymentStatus.Pending,
      notes: dto.notes ?? null,
      processedBy: null,
    });
    await AuditService.record(manager, user, 'payment.created', 'payment', payment.id, null,
      { invoiceId, amount: payment.amount, status: payment.paymentStatus });
    return payment;
    });
  }

  /** Simulated gateway — always succeeds for local/demo checkout. */
  async payWithTestGateway(user: AuthUser, invoiceId: string): Promise<{
    payment: PaymentEntity;
    invoice: InvoiceEntity;
  }> {
    if (process.env.NODE_ENV === 'production') {
      throw new ConflictException('پرداخت آزمایشی در محیط عملیاتی مجاز نیست.');
    }
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    const invoice = await this.invoices.findOne({ where: { id: invoiceId } });
    if (!customer || !invoice || invoice.customerId !== customer.id) {
      throw new NotFoundException('فاکتور یافت نشد.');
    }
    if (invoice.paymentStatus === 'paid') throw new ConflictException('این فاکتور قبلاً پرداخت شده است.');

    const payment = await this.payments.save({
      id: randomUUID(),
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      amount: invoice.totalAfterTax,
      currency: invoice.currency,
      paymentMethod: 'test_gateway',
      transactionId: `TEST-${Date.now()}`,
      paymentStatus: 'completed',
      notes: 'پرداخت آزمایشی موفق (بدون توکن درگاه واقعی)',
      processedBy: 'system:test-gateway',
    });
    await this.markPaid(invoice, 'test_gateway');
    const refreshed = await this.invoices.findOne({ where: { id: invoice.id } });
    return { payment, invoice: refreshed! };
  }

  async findAll(page = 1, limit = 20, sort = 'createdAt', order: 'asc'|'desc' = 'desc') {
    const sortMap: Record<string, string> = { createdAt: 'createdAt', amount: 'amount', paymentStatus: 'paymentStatus' };
    const [data, total] = await this.payments.findAndCount({ order: { [sortMap[sort] ?? 'createdAt']: order.toUpperCase() as 'ASC'|'DESC' }, skip: (page - 1) * limit, take: limit });
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  findMine(user: AuthUser): Promise<PaymentEntity[]> {
    return this.customers.findOne({ where: { userId: user.userId } }).then(async (customer) => {
      if (!customer) return [];
      const invoices = await this.invoices.find({ where: { customerId: customer.id } });
      if (!invoices.length) return [];
      const invoiceIds = new Set(invoices.map((i) => i.id));
      const all = await this.payments.find({ order: { createdAt: 'DESC' } });
      return all.filter((p) => invoiceIds.has(p.invoiceId));
    });
  }

  async updateStatus(id: string, paymentStatus: PaymentStatus, actor: AuditActor): Promise<PaymentEntity> {
    if (!Object.values(PaymentStatus).includes(paymentStatus)) throw new BadRequestException('وضعیت پرداخت معتبر نیست.');
    return this.payments.manager.transaction(async (manager) => {
      const payments = manager.getRepository(PaymentEntity);
      const initial = await payments.findOneBy({ id });
      if (!initial) throw new NotFoundException('پرداخت یافت نشد.');
      const invoice = await manager.getRepository(InvoiceEntity).findOne({
        where: { id: initial.invoiceId },
        ...(manager.connection.options.type === 'postgres' ? { lock: { mode: 'pessimistic_write' as const } } : {}),
      });
      if (!invoice) throw new NotFoundException('فاکتور یافت نشد.');
      const payment = await payments.findOneByOrFail({ id });
      if (payment.paymentStatus === paymentStatus) return payment;
      if (payment.paymentStatus !== PaymentStatus.Pending || paymentStatus === PaymentStatus.Pending) {
        throw new ConflictException('تغییر وضعیت این پرداخت مجاز نیست.');
      }
      const oldStatus = payment.paymentStatus;
      const previousPaid = await payments.sum('amount', { invoiceId: invoice.id, paymentStatus: PaymentStatus.Completed }) ?? 0;
      if (paymentStatus === PaymentStatus.Completed &&
          (invoice.paymentStatus === 'cancelled' || previousPaid + payment.amount > invoice.totalAfterTax)) {
        throw new ConflictException('تأیید این پرداخت با وضعیت یا مانده فاکتور سازگار نیست.');
      }
      payment.paymentStatus = paymentStatus;
      payment.processedBy = actor.userId;
      payment.processedAt = new Date().toISOString();
      await payments.save(payment);
      const paid = await payments.sum('amount', { invoiceId: invoice.id, paymentStatus: PaymentStatus.Completed }) ?? 0;
      const previousInvoiceStatus = invoice.paymentStatus;
      if (invoice.paymentStatus !== 'cancelled') {
        invoice.paymentStatus = paid >= invoice.totalAfterTax ? 'paid' : paid > 0 ? 'partially_paid' : 'pending';
      }
      invoice.paidAt = invoice.paymentStatus === 'paid' ? new Date() : null;
      if (paymentStatus === PaymentStatus.Completed) invoice.paymentMethod = payment.paymentMethod;
      await manager.getRepository(InvoiceEntity).save(invoice);
      await AuditService.record(manager, actor, 'payment.status_changed', 'payment', id,
        { status: oldStatus }, { status: paymentStatus, processedAt: payment.processedAt });
      await AuditService.record(manager, actor, 'invoice.payment_changed', 'invoice', invoice.id,
        { status: previousInvoiceStatus }, { status: invoice.paymentStatus, paidAmount: paid });
      if (invoice.orderId) {
        const orders = manager.getRepository(OrderEntity);
        const order = await orders.findOneBy({ id: invoice.orderId });
        if (order) {
          const previous = order.paymentStatus;
          order.paymentStatus = paid >= invoice.totalAfterTax ? 'paid' : paid > 0 ? 'partially_paid' : 'unpaid';
          if (paid >= invoice.totalAfterTax && order.status === 'pending') order.status = 'processing';
          await orders.save(order);
          await AuditService.record(manager, actor, 'order.payment_changed', 'order', order.id,
            { paymentStatus: previous }, { paymentStatus: order.paymentStatus });
        }
      }
      return payment;
    });
  }
}
