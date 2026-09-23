import type { SparePart } from '@/lib/api-client';

function currencyLabel(currency?: string | null) {
  const raw = (currency ?? '').trim().toUpperCase();
  if (!raw || raw === 'IRR' || raw === 'RLS' || raw === 'ریال') return 'ریال';
  return currency!.trim();
}

/** قیمت نمایشی قطعه: توافقی یا مبلغ با واحد ارز */
export function formatPartPrice(
  part: Pick<SparePart, 'price' | 'priceNegotiable' | 'currency'>,
): string {
  if (part.priceNegotiable) return 'توافقی';
  return `${part.price.toLocaleString('fa-IR')} ${currencyLabel(part.currency)}`;
}

export function formatCartMoney(amount: number, currency?: string | null) {
  return `${amount.toLocaleString('fa-IR')} ${currencyLabel(currency)}`;
}
