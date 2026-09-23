import { ConflictException } from '@nestjs/common';
import { EntityManager, In, IsNull, Like, Not } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { OtpChallengeEntity } from '../auth/otp-challenge.entity';
import { OrderEntity } from '../orders/order.entity';
import { InvoiceEntity } from '../invoices/invoice.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { QuotationEntity } from '../quotations/quotation.entity';
import { ProjectEntity } from '../projects/project.entity';
import { CustomerEntity } from './customer.entity';

/** Called inside a transaction. Keep anonymous keys for accounting; erase structured customer identity. */
export async function purgeCustomerIdentity(
  manager: EntityManager,
  customer: CustomerEntity,
  user: UserEntity | null,
  actorId: string,
): Promise<void> {
  const now = new Date().toISOString();
  // Atomic claim also prevents two concurrent purge requests from partially redoing this operation.
  const claimed = await manager.update(CustomerEntity, {
    id: customer.id, deletedAt: Not(IsNull()), purgedAt: IsNull(),
  }, {
    purgedAt: now, status: 'inactive', statusReason: null,
    statusChangedAt: now, statusChangedBy: actorId,
    companyName: null, companyRegistrationNumber: null, companyWebsite: null,
    industry: null, country: null, city: null, address: null, phone: null,
    contactPerson: null, notes: null, isVerified: false, creditLimit: 0,
  });
  if (claimed.affected !== 1) throw new ConflictException('مشتری باید ابتدا حذف نرم شده باشد و قبلاً حذف دائمی نشده باشد.');

  const invoices = await manager.find(InvoiceEntity, {
    where: { customerId: customer.id }, withDeleted: true, select: { id: true },
  });
  const orders = await manager.find(OrderEntity, {
    where: { customerId: customer.id }, withDeleted: true, select: { id: true },
  });
  await manager.update(OrderEntity, { customerId: customer.id }, {
    shippingAddress: {}, billingAddress: {}, notes: null,
  });
  await manager.update(InvoiceEntity, { customerId: customer.id }, {
    customerSnapshotJson: { customerId: customer.id, contactPerson: 'مشتری حذف‌شده' },
    shippingSnapshotJson: {}, billingSnapshotJson: {}, notes: null,
  });
  const paymentCriteria = [
    ...(invoices.length ? [{ invoiceId: In(invoices.map((item) => item.id)) }] : []),
    ...(orders.length ? [{ orderId: In(orders.map((item) => item.id)) }] : []),
  ];
  if (paymentCriteria.length) await manager.update(PaymentEntity, paymentCriteria, { notes: null });
  await manager.update(QuotationEntity, { customerId: customer.id }, { notes: null, termsAndConditions: null });
  await manager.update(ProjectEntity, { customerId: customer.id }, { clientDisplayName: null });

  const phones = [...new Set([user?.phone, customer.phone].filter((phone): phone is string => Boolean(phone)))];
  const challenges = await manager.find(OtpChallengeEntity, {
    where: [
      { meta: Like(`%${customer.userId}%`) },
      ...(phones.length ? [{ phone: In(phones) }] : []),
    ],
  });
  for (const challenge of challenges) {
    let linked = phones.includes(challenge.phone);
    if (!linked && challenge.meta) {
      try { linked = (JSON.parse(challenge.meta) as { userId?: string }).userId === customer.userId; } catch { /* Not this user's challenge. */ }
    }
    if (linked) await manager.delete(OtpChallengeEntity, challenge.id);
  }
  if (user) {
    await manager.update(UserEntity, user.id, {
      email: null, phone: null, passwordHash: null, firstName: null, lastName: null,
      companyName: null, isActive: false, twoFactorEnabled: false, lastLoginAt: null,
      deletedAt: user.deletedAt ?? new Date(),
    });
  }
}
