import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CustomerEntity } from '../customers/customer.entity';
import { InvoiceEntity } from './invoice.entity';
import { InvoicePaymentStatus, invoicePaymentTransitions } from './invoice-status';
import { DataSource } from 'typeorm';
import { AuditActor, AuditService } from '../audit/audit.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(InvoiceEntity) private readonly invoices: Repository<InvoiceEntity>,
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findMine(user: AuthUser): Promise<InvoiceEntity[]> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    return customer
      ? this.invoices.find({ where: { customerId: customer.id }, order: { createdAt: 'DESC' } })
      : [];
  }

  async findOneMine(user: AuthUser, idOrNumber: string): Promise<InvoiceEntity> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    const invoice = customer
      ? await this.invoices.findOne({
          where: [
            { id: idOrNumber, customerId: customer.id },
            { invoiceNumber: idOrNumber, customerId: customer.id },
          ],
        })
      : null;
    if (!invoice) throw new NotFoundException('فاکتور یافت نشد.');
    return invoice;
  }

  async findAll(page = 1, limit = 20, sort = 'createdAt', order: 'asc'|'desc' = 'desc') {
    const sortMap: Record<string, string> = { createdAt: 'createdAt', invoiceNumber: 'invoiceNumber', totalAfterTax: 'totalAfterTax', paymentStatus: 'paymentStatus' };
    const [data, total] = await this.invoices.findAndCount({ order: { [sortMap[sort] ?? 'createdAt']: order.toUpperCase() as 'ASC'|'DESC' }, skip: (page - 1) * limit, take: limit });
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOneAdmin(id: string): Promise<InvoiceEntity> {
    const invoice = await this.invoices.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('فاکتور یافت نشد.');
    return invoice;
  }

  async updateStatus(id: string, paymentStatus: InvoicePaymentStatus, actor: AuditActor): Promise<InvoiceEntity> {
    const invoice = await this.invoices.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('فاکتور یافت نشد.');
    const current = invoice.paymentStatus;
    if (current === paymentStatus) return invoice;
    if (!invoicePaymentTransitions[current as InvoicePaymentStatus]?.includes(paymentStatus)) {
      throw new BadRequestException('تغییر وضعیت فاکتور مجاز نیست.');
    }
    return this.dataSource.transaction(async manager => {
      const locked = await manager.getRepository(InvoiceEntity).findOne({ where: { id }, ...(manager.connection.options.type === 'postgres' ? { lock: { mode: 'pessimistic_write' as const } } : {}) });
      if (!locked) throw new NotFoundException('فاکتور یافت نشد.');
      if (locked.paymentStatus !== current || !invoicePaymentTransitions[locked.paymentStatus as InvoicePaymentStatus]?.includes(paymentStatus)) throw new BadRequestException('این تغییر وضعیت دیگر مجاز نیست.');
      locked.paymentStatus = paymentStatus;
      if (paymentStatus === InvoicePaymentStatus.Paid && !locked.paidAt) locked.paidAt = new Date();
      const saved = await manager.getRepository(InvoiceEntity).save(locked);
      await AuditService.record(manager, actor, 'invoice.status_changed', 'invoice', id, { status: current }, { status: paymentStatus });
      return saved;
    });
  }
}
