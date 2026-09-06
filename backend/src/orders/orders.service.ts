import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CustomerEntity } from '../customers/customer.entity';
import { QuotationEntity } from '../quotations/quotation.entity';
import { OrderEntity } from './order.entity';
import { OrderItemEntity } from './order-item.entity';
import { InvoiceEntity } from '../invoices/invoice.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly orderItems: Repository<OrderItemEntity>,
    @InjectRepository(QuotationEntity) private readonly quotations: Repository<QuotationEntity>,
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
    @InjectRepository(InvoiceEntity) private readonly invoices: Repository<InvoiceEntity>,
  ) {}

  async convertQuotation(user: AuthUser, quotationId: string): Promise<OrderEntity> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    const quotation = await this.quotations.findOne({ where: { id: quotationId } });
    if (!customer || !quotation || quotation.customerId !== customer.id) throw new NotFoundException('Quotation not found');
    if (quotation.status !== 'accepted') throw new ConflictException('Quotation must be accepted before conversion');

    const existingOrder = await this.orders.findOne({ where: { referenceQuotationId: quotation.id } });
    if (existingOrder) return existingOrder;

    const order = await this.orders.save({
      id: randomUUID(), orderNumber: `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      customerId: customer.id, createdBy: user.userId, status: 'pending', orderType: 'custom',
      shippingAddress: {}, billingAddress: {}, subtotal: quotation.subtotal, taxAmount: quotation.taxAmount,
      shippingCost: 0, discountAmount: quotation.discountAmount, totalAmount: quotation.totalAmount,
      currency: quotation.currency, paymentStatus: 'unpaid', referenceQuotationId: quotation.id, notes: quotation.notes,
    });
    await this.orderItems.save(quotation.items.map((item) => ({
      id: randomUUID(), orderId: order.id, productId: item.productId, quantity: item.quantity,
      unitPrice: item.unitPrice, lineTotal: item.lineTotal, currency: quotation.currency,
      customizationsJson: item.customizations, status: 'pending',
    })));
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    await this.invoices.save({ id: randomUUID(), invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, orderId: order.id, quotationId: quotation.id, customerId: customer.id, dueDate, totalBeforeTax: order.subtotal, taxAmount: order.taxAmount, totalAfterTax: order.totalAmount, currency: order.currency, paymentStatus: 'pending', notes: order.notes });
    return order;
  }

  findMine(user: AuthUser): Promise<OrderEntity[]> {
    return this.customers.findOne({ where: { userId: user.userId } }).then((customer) => customer ? this.orders.find({ where: { customerId: customer.id }, order: { createdAt: 'DESC' } }) : []);
  }

  async findOneMine(user: AuthUser, idOrNumber: string): Promise<OrderEntity> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    const order = customer ? await this.orders.findOne({ where: [{ id: idOrNumber, customerId: customer.id }, { orderNumber: idOrNumber, customerId: customer.id }] }) : null;
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  findAll(): Promise<OrderEntity[]> { return this.orders.find({ order: { createdAt: 'DESC' } }); }

  async updateStatus(id: string, status: string): Promise<OrderEntity> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    order.status = status;
    return this.orders.save(order);
  }
}
