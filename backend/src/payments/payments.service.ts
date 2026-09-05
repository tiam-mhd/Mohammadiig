import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CustomerEntity } from '../customers/customer.entity';
import { InvoiceEntity } from '../invoices/invoice.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentEntity } from './payment.entity';

@Injectable()
export class PaymentsService {
  constructor(@InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>, @InjectRepository(InvoiceEntity) private readonly invoices: Repository<InvoiceEntity>, @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>) {}

  async create(user: AuthUser, invoiceId: string, dto: CreatePaymentDto): Promise<PaymentEntity> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    const invoice = await this.invoices.findOne({ where: { id: invoiceId } });
    if (!customer || !invoice || invoice.customerId !== customer.id) throw new NotFoundException('Invoice not found');
    if (invoice.paymentStatus === 'paid') throw new ConflictException('Invoice is already paid');
    if (dto.amount > invoice.totalAfterTax) throw new ConflictException('Payment amount exceeds invoice total');
    const payment = await this.payments.save({ id: randomUUID(), invoiceId, orderId: invoice.orderId, amount: dto.amount, currency: invoice.currency, paymentMethod: dto.paymentMethod, transactionId: dto.transactionId ?? null, paymentStatus: 'pending', notes: dto.notes ?? null, processedBy: null });
    return payment;
  }
}
