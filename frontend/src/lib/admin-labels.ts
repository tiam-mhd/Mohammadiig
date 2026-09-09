/** برچسب‌های فارسی سلیس برای پنل مدیریت */

export const CATEGORY_LABELS: Record<string, string> = {
  EQUIPMENT: 'تجهیزات',
  FAMILY: 'خانوادگی',
  'AFTER-SALES': 'پس از فروش',
  equipment: 'تجهیزات',
  family: 'خانوادگی',
  'after-sales': 'پس از فروش',
};

export const QUOTATION_STATUS: Record<string, string> = {
  draft: 'پیش‌نویس',
  sent: 'ارسال‌شده',
  accepted: 'پذیرفته‌شده',
  rejected: 'ردشده',
  expired: 'منقضی',
};

export const ORDER_STATUS: Record<string, string> = {
  pending: 'در انتظار',
  processing: 'در حال پردازش',
  manufactured: 'تولیدشده',
  shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده',
  cancelled: 'لغوشده',
};

export const PAYMENT_STATUS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  processing: 'در حال پردازش',
  partial: 'پرداخت ناقص',
  paid: 'پرداخت‌شده',
  completed: 'تکمیل‌شده',
  failed: 'ناموفق',
  overdue: 'سررسید گذشته',
  cancelled: 'لغوشده',
};

export const PROJECT_STATUS: Record<string, string> = {
  planning: 'برنامه‌ریزی',
  in_progress: 'در حال اجرا',
  on_hold: 'متوقف موقت',
  completed: 'تکمیل‌شده',
  cancelled: 'لغوشده',
};

export const PROJECT_TYPE: Record<string, string> = {
  operation: 'بهره‌برداری',
  partnership: 'مشارکت',
  investment: 'سرمایه‌گذاری',
};

export const PORTFOLIO_CATEGORY: Record<string, string> = {
  entertainment: 'تفریحی',
  family: 'خانوادگی',
  commercial: 'تجاری',
  installation: 'نصب و تجهیز',
  other: 'سایر',
};

export function formatLocation(parts: {
  country?: string | null;
  province?: string | null;
  city?: string | null;
  locationDetail?: string | null;
}) {
  return [parts.locationDetail, parts.city, parts.province, parts.country].filter(Boolean).join(' · ') || '—';
}

export const INVOICE_STATUS: Record<string, string> = {
  pending: 'در انتظار',
  partial: 'پرداخت ناقص',
  paid: 'تسویه‌شده',
  overdue: 'معوق',
  cancelled: 'لغوشده',
};

export const SERVICE_CATEGORY: Record<string, string> = {
  installation: 'نصب',
  training: 'آموزش',
  maintenance: 'نگهداری',
  support: 'پشتیبانی',
  customization: 'سفارشی‌سازی',
  other: 'سایر',
};

export const SERVICE_UNIT: Record<string, string> = {
  per_hour: 'ساعتی',
  per_day: 'روزانه',
  per_visit: 'هر مراجعه',
  per_unit: 'هر واحد',
  fixed: 'مبلغ ثابت',
};

export const USER_ROLE: Record<string, string> = {
  admin: 'مدیر سیستم',
  salesman: 'فروشنده',
  support: 'پشتیبانی',
  accountant: 'حسابدار',
  customer: 'مشتری',
};

export const OWNER_TYPE: Record<string, string> = {
  Order: 'سفارش',
  Quotation: 'پیش‌فاکتور',
  Project: 'پروژه',
  Invoice: 'فاکتور',
  ProjectPhase: 'مرحله پروژه',
};

export const PAYMENT_METHOD: Record<string, string> = {
  card: 'کارت بانکی',
  transfer: 'حواله',
  cash: 'نقدی',
  cheque: 'چک',
  online: 'پرداخت آنلاین',
  gateway: 'درگاه پرداخت',
};

export function labelOf(map: Record<string, string>, value: string | null | undefined, fallback = '—') {
  if (!value) return fallback;
  return map[value] ?? value;
}

export function formatMoney(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '—';
  return `${amount.toLocaleString('fa-IR')} ریال`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fa-IR');
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fa-IR');
}
