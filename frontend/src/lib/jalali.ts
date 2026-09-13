/** تبدیل و کمکی‌های تقویم شمسی (الگوریتم استاندارد جلالی) */

export type JalaliParts = { jy: number; jm: number; jd: number };
export type GregorianParts = { gy: number; gm: number; gd: number };

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

function div(a: number, b: number) {
  return Math.trunc(a / b);
}

function mod(a: number, b: number) {
  return a - Math.trunc(a / b) * b;
}

export function isLeapJalaaliYear(jy: number): boolean {
  const r = mod(jy - (jy > 0 ? 474 : 473), 2820) + 474;
  return mod(r * 682 - 110, 2816) < 682;
}

export function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaaliYear(jy) ? 30 : 29;
}

function jalCal(jy: number) {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;

  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error(`Invalid Jalali year ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): GregorianParts {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export function toJalaali(gy: number, gm: number, gd: number): JalaliParts {
  const jdn = g2d(gy, gm, gd);
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  let jm: number;
  let jd: number;

  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }

  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

export function toGregorian(jy: number, jm: number, jd: number): GregorianParts {
  const r = jalCal(jy);
  const jdn =
    g2d(r.gy, 3, r.march) +
    (jm - 1) * 31 -
    div(jm, 7) * (jm - 7) +
    jd -
    1;
  return d2g(jdn);
}

export function todayJalali(): JalaliParts {
  const now = new Date();
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function parseIsoDate(iso: string | null | undefined): GregorianParts | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!match) return null;
  const gy = Number(match[1]);
  const gm = Number(match[2]);
  const gd = Number(match[3]);
  if (!gy || gm < 1 || gm > 12 || gd < 1 || gd > 31) return null;
  return { gy, gm, gd };
}

export function toIsoDate(gy: number, gm: number, gd: number): string {
  return `${String(gy).padStart(4, '0')}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const maxDay = jalaaliMonthLength(jy, jm);
  const safeDay = Math.min(Math.max(jd, 1), maxDay);
  const g = toGregorian(jy, jm, safeDay);
  return toIsoDate(g.gy, g.gm, g.gd);
}

export function isoToJalali(iso: string | null | undefined): JalaliParts | null {
  const g = parseIsoDate(iso);
  if (!g) return null;
  return toJalaali(g.gy, g.gm, g.gd);
}

export function formatJalali(iso: string | null | undefined, withMonthName = false): string {
  const j = isoToJalali(iso);
  if (!j) return '';
  const day = toFaDigits(j.jd);
  const year = toFaDigits(j.jy);
  if (withMonthName) {
    return `${day} ${PERSIAN_MONTHS[j.jm - 1]} ${year}`;
  }
  const month = toFaDigits(j.jm);
  return `${year}/${month}/${day}`;
}

export function toFaDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!);
}

export function buildYearRange(minYear = 1300, maxYear?: number): number[] {
  const today = todayJalali();
  const end = maxYear ?? today.jy + 10;
  const years: number[] = [];
  for (let y = end; y >= minYear; y -= 1) years.push(y);
  return years;
}
