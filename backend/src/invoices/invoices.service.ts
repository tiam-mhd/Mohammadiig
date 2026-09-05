import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CustomerEntity } from '../customers/customer.entity';
import { InvoiceEntity } from './invoice.entity';

@Injectable()
export class InvoicesService {
  constructor(@InjectRepository(InvoiceEntity) private readonly invoices: Repository<InvoiceEntity>, @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>) {}

  async findMine(user: AuthUser): Promise<InvoiceEntity[]> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    return customer ? this.invoices.find({ where: { customerId: customer.id }, order: { createdAt: 'DESC' } }) : [];
  }
}
