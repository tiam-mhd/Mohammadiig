import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CustomerEntity } from '../customers/customer.entity';
import { InvoiceEntity } from './invoice.entity';
import { InvoicePaymentStatus, invoicePaymentTransitions } from './invoice-status';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(InvoiceEntity) private readonly invoices: Repository<InvoiceEntity>,
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
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

  findAll(): Promise<InvoiceEntity[]> {
    return this.invoices.find({ order: { createdAt: 'DESC' } });
  }

  async findOneAdmin(id: string): Promise<InvoiceEntity> {
    const invoice = await this.invoices.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('فاکتور یافت نشد.');
    return invoice;
  }

  async updateStatus(id: string, paymentStatus: InvoicePaymentStatus): Promise<InvoiceEntity> {
    const invoice = await this.invoices.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('فاکتور یافت نشد.');
    const current = invoice.paymentStatus;
    if (current === paymentStatus) return invoice;
    if (!invoicePaymentTransitions[current as InvoicePaymentStatus]?.includes(paymentStatus)) {
      throw new BadRequestException('تغییر وضعیت فاکتور مجاز نیست.');
    }
    invoice.paymentStatus = paymentStatus;
    if (paymentStatus === InvoicePaymentStatus.Paid && !invoice.paidAt) {
      invoice.paidAt = new Date();
    }
    return this.invoices.save(invoice);
  }
}
