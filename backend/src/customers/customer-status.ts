import { ForbiddenException } from '@nestjs/common';
import type { CustomerEntity } from './customer.entity';

export const CUSTOMER_STATUSES = ['active', 'inactive', 'blocked', 'pending_review'] as const;
export type CustomerStatus = typeof CUSTOMER_STATUSES[number];

/** Account verification is independent of permission to sign in and buy. */
export function assertCustomerAccess(customer: CustomerEntity | null): void {
  if (!customer) return;
  if (customer.deletedAt || customer.purgedAt) {
    throw new ForbiddenException('حساب مشتری حذف شده است. با پشتیبانی تماس بگیرید.');
  }
  const messages: Record<Exclude<CustomerStatus, 'active'>, string> = {
    inactive: 'حساب شما غیرفعال است. با پشتیبانی تماس بگیرید.',
    blocked: 'حساب شما مسدود شده است. برای پیگیری با پشتیبانی تماس بگیرید.',
    pending_review: 'حساب شما در انتظار بررسی مدیر است. پس از بررسی امکان ورود و خرید فراهم می‌شود.',
  };
  if (customer.status !== 'active') {
    // Reasons are staff-only; public OTP requests must not reveal private moderation notes.
    throw new ForbiddenException(messages[customer.status] ?? 'حساب شما فعال نیست.');
  }
}
