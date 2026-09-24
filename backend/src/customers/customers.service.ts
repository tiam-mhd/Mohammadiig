import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { CustomerEntity } from './customer.entity';
import { UserEntity } from '../auth/user.entity';
import { OrderEntity } from '../orders/order.entity';
import { OrderItemEntity } from '../orders/order-item.entity';
import { InvoiceEntity } from '../invoices/invoice.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { QuotationEntity } from '../quotations/quotation.entity';
import { ensureCustomerProfile } from './customer-profile';
import { UpdateCustomerStatusDto } from './dto/customer-admin.dto';
import { purgeCustomerIdentity } from './customer-purge';

export type CustomerAdminSummary = CustomerEntity & { isActive: boolean };

export type Customer360 = {
  customer: CustomerAdminSummary;
  user: Pick<
    UserEntity,
    'id' | 'email' | 'phone' | 'firstName' | 'lastName' | 'companyName' | 'role' | 'createdAt' | 'lastLoginAt'
  > | null;
  orders: Array<OrderEntity & { items: OrderItemEntity[] }>;
  invoices: InvoiceEntity[];
  payments: PaymentEntity[];
  quotations: QuotationEntity[];
  stats: {
    ordersCount: number;
    invoicesCount: number;
    paidTotal: number;
    unpaidTotal: number;
    sparePartsOrdersCount: number;
  };
};

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly orderItems: Repository<OrderItemEntity>,
    @InjectRepository(InvoiceEntity) private readonly invoices: Repository<InvoiceEntity>,
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(QuotationEntity) private readonly quotations: Repository<QuotationEntity>,
  ) {}

  async findByUserId(userId: string): Promise<Omit<CustomerEntity, 'statusReason' | 'statusChangedBy'>> {
    const user = await this.users.findOne({ where: { id: userId } });
    const customer = await ensureCustomerProfile(this.customers, user);
    const { statusReason: _reason, statusChangedBy: _actor, ...profile } = customer;
    return profile;
  }

  async findAll(status: 'current' | 'deleted' = 'current', page = 1, limit = 20, search = '') {
    const qb = this.customers.createQueryBuilder('customer').withDeleted().where('customer.purged_at IS NULL').andWhere(status === 'deleted' ? 'customer.deleted_at IS NOT NULL' : 'customer.deleted_at IS NULL');
    if (search.trim()) qb.andWhere('(LOWER(customer.company_name) LIKE LOWER(:search) OR LOWER(customer.contact_person) LIKE LOWER(:search) OR LOWER(customer.phone) LIKE LOWER(:search))', { search: `%${search.trim()}%` });
    const [customers, total] = await qb.orderBy('customer.created_at', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    const users = customers.length ? await this.users.find({
      where: { id: In(customers.map((customer) => customer.userId)) },
      select: { id: true, isActive: true, deletedAt: true },
      withDeleted: true,
    }) : [];
    const byId = new Map(users.map((user) => [user.id, user]));
    const data = customers.map((customer) => {
      const user = byId.get(customer.userId);
      return Object.assign(customer, {
        status: customer.status === 'active' && (!user?.isActive || user.deletedAt) ? 'inactive' as const : customer.status,
        isActive: Boolean(user?.isActive && !user.deletedAt && !customer.deletedAt && customer.status === 'active'),
      });
    });
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async get360(id: string): Promise<Customer360> {
    const customer = await this.customers.findOne({ where: { id, purgedAt: IsNull() }, withDeleted: true });
    if (!customer) throw new NotFoundException('مشتری پیدا نشد');

    const user = await this.users.findOne({ where: { id: customer.userId }, withDeleted: true });
    const [orders, invoices, quotations] = await Promise.all([
      this.orders.find({ where: { customerId: customer.id }, order: { createdAt: 'DESC' } }),
      this.invoices.find({ where: { customerId: customer.id }, order: { createdAt: 'DESC' } }),
      this.quotations.find({ where: { customerId: customer.id }, order: { createdAt: 'DESC' } }),
    ]);

    const orderIds = orders.map((o) => o.id);
    const items = orderIds.length
      ? await this.orderItems.find({ where: { orderId: In(orderIds) } })
      : [];
    const itemsByOrder = new Map<string, OrderItemEntity[]>();
    for (const item of items) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    const invoiceIds = invoices.map((i) => i.id);
    const allPayments = invoiceIds.length
      ? await this.payments.find({ order: { createdAt: 'DESC' } })
      : [];
    const invoiceIdSet = new Set(invoiceIds);
    const payments = allPayments.filter((p) => invoiceIdSet.has(p.invoiceId));

    const paidTotal = invoices
      .filter((i) => i.paymentStatus === 'paid')
      .reduce((sum, i) => sum + i.totalAfterTax, 0);
    const unpaidTotal = invoices
      .filter((i) => i.paymentStatus !== 'paid' && i.paymentStatus !== 'cancelled')
      .reduce((sum, i) => sum + i.totalAfterTax, 0);

    return {
      customer: Object.assign(customer, {
        status: customer.status === 'active' && (!user?.isActive || user.deletedAt) ? 'inactive' as const : customer.status,
        isActive: Boolean(user?.isActive && !user.deletedAt && !customer.deletedAt && customer.status === 'active'),
      }),
      user: user
        ? {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            companyName: user.companyName,
            role: user.role,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          }
        : null,
      orders: orders.map((order) => Object.assign(order, { items: itemsByOrder.get(order.id) ?? [] })),
      invoices,
      payments,
      quotations,
      stats: {
        ordersCount: orders.length,
        invoicesCount: invoices.length,
        paidTotal,
        unpaidTotal,
        sparePartsOrdersCount: orders.filter((o) => o.orderType === 'spare_parts').length,
      },
    };
  }

  async setVerified(id: string, isVerified: boolean): Promise<CustomerEntity> {
    const customer = await this.customers.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('مشتری پیدا نشد');
    customer.isVerified = isVerified;
    return this.customers.save(customer);
  }

  async softRemove(id: string): Promise<void> {
    await this.customers.manager.transaction(async (manager) => {
      const customer = await manager.findOne(CustomerEntity, { where: { id } });
      if (!customer) throw new NotFoundException('مشتری پیدا نشد');
      const user = await manager.findOne(UserEntity, { where: { id: customer.userId }, withDeleted: true });
      if (user && user.role !== 'customer') throw new BadRequestException('حساب کارکنان را از بخش کاربران مدیریت کنید.');
      await manager.softDelete(CustomerEntity, id);
      if (user) await manager.update(UserEntity, user.id, { isActive: false });
    });
  }

  async updateStatus(id: string, dto: UpdateCustomerStatusDto, actorId: string): Promise<CustomerAdminSummary> {
    const status = dto.status ?? (dto.isActive === undefined ? undefined : dto.isActive ? 'active' : 'inactive');
    if (!status) throw new BadRequestException('وضعیت مشتری را انتخاب کنید.');
    if (dto.isActive !== undefined && dto.isActive !== (status === 'active')) {
      throw new BadRequestException('وضعیت و دسترسی حساب با هم سازگار نیستند.');
    }
    const reason = dto.reason?.trim() || null;
    if (status === 'blocked' && !reason) throw new BadRequestException('برای مسدودسازی مشتری، دلیل را وارد کنید.');
    return this.customers.manager.transaction(async (manager) => {
      const customer = await manager.findOne(CustomerEntity, { where: { id, purgedAt: IsNull() } });
      if (!customer) throw new NotFoundException('مشتری پیدا نشد');
      const user = await manager.findOne(UserEntity, { where: { id: customer.userId } });
      if (!user) throw new NotFoundException('حساب کاربری مشتری پیدا نشد');
      if (user.role !== 'customer') throw new BadRequestException('حساب کارکنان را از بخش کاربران مدیریت کنید.');
      const changed = await manager.update(CustomerEntity, { id, deletedAt: IsNull(), purgedAt: IsNull() }, {
        status, statusReason: reason, isVerified: dto.isVerified,
        statusChangedAt: new Date().toISOString(), statusChangedBy: actorId,
      });
      if (!changed.affected) throw new NotFoundException('مشتری پیدا نشد');
      await manager.update(UserEntity, user.id, { isActive: status === 'active' });
      const updated = await manager.findOneByOrFail(CustomerEntity, { id });
      return Object.assign(updated, { isActive: status === 'active' });
    });
  }

  async permanentlyRemove(id: string, actorId: string): Promise<void> {
    await this.customers.manager.transaction(async (manager) => {
      const customer = await manager.findOne(CustomerEntity, { where: { id, purgedAt: IsNull() }, withDeleted: true });
      if (!customer) throw new NotFoundException('مشتری پیدا نشد یا قبلاً حذف دائمی شده است.');
      if (!customer.deletedAt) throw new BadRequestException('حذف دائمی فقط برای مشتریان حذف نرم شده مجاز است.');
      const user = await manager.findOne(UserEntity, { where: { id: customer.userId }, withDeleted: true });
      if (user && user.role !== 'customer') throw new BadRequestException('حذف دائمی حساب کارکنان از بخش مشتریان مجاز نیست.');
      await purgeCustomerIdentity(manager, customer, user, actorId);
    });
  }
}
