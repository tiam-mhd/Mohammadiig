export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'pending_review';

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  blocked: 'مسدود',
  pending_review: 'در انتظار بررسی',
};

export const CUSTOMER_STATUS_DESCRIPTIONS: Record<CustomerStatus, string> = {
  active: 'مشتری می‌تواند وارد حساب شود و خرید کند.',
  inactive: 'دسترسی مشتری تا فعال‌سازی مجدد توسط مدیر متوقف می‌شود.',
  blocked: 'ورود و خرید مسدود می‌شود. ثبت دلیل برای پیگیری مدیریتی الزامی است.',
  pending_review: 'تا پایان بررسی مدیر، ورود و خرید مجاز نیست. پس از بررسی، وضعیت را به فعال تغییر دهید.',
};
