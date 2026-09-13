/** Normalize Iranian mobile numbers to `09xxxxxxxxx`. */
export function normalizeIranMobile(raw: string): string | null {
  if (!raw) return null;
  const digits = raw
    .trim()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');

  let mobile = digits;
  if (mobile.startsWith('0098')) mobile = mobile.slice(4);
  else if (mobile.startsWith('98')) mobile = mobile.slice(2);
  if (mobile.startsWith('9') && mobile.length === 10) mobile = `0${mobile}`;
  if (!/^09\d{9}$/.test(mobile)) return null;
  return mobile;
}

export function maskMobile(mobile: string): string {
  if (mobile.length < 8) return mobile;
  return `${mobile.slice(0, 4)}***${mobile.slice(-2)}`;
}
