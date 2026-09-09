import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Injectable()
export class CustomersService {
  constructor(@InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>) {}

  async findByUserId(userId: string): Promise<CustomerEntity> {
    const customer = await this.customers.findOne({ where: { userId } });
    if (!customer) throw new NotFoundException('Customer profile not found');
    return customer;
  }

  findAll(): Promise<CustomerEntity[]> { return this.customers.find({ order: { createdAt: 'DESC' } }); }

  async setVerified(id: string, isVerified: boolean): Promise<CustomerEntity> {
    const customer = await this.customers.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('مشتری پیدا نشد');
    customer.isVerified = isVerified;
    return this.customers.save(customer);
  }

  async softRemove(id: string): Promise<void> {
    const customer = await this.customers.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('مشتری پیدا نشد');
    await this.customers.softRemove(customer);
  }
}
