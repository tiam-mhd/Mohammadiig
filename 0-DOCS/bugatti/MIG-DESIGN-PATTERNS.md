# MIG Design Patterns — Bugatti-Inspired Luxury Industrial

سیستم طراحی سایت و پنل MIG، اقتباس‌شده از زبان بصری Bugatti: بوم سیاه خالص، تایپوگرافی دقیق با فاصله‌گذاری وسیع، عکاسی full-bleed، و حذف کامل کروم تزئینی.

> اصل بنیادین: **عکاسی + تایپوگرافی + وردمارک برند** — هیچ رنگ اکسنت، سایه، گرادیان تزئینی، یا کارت‌های پرزرق‌وبرق.

---

## 1. Brand Voice

| محور | تعریف |
|------|--------|
| لحن | مهندسی‌شده، کم‌حرف، لوکس صنعتی |
| حالت | فقط Dark Canvas — بدون Light Mode در سطوح مارکتینگ |
| ولتاژ بصری | فقط از عکس محصول/پروژه می‌آید |
| تأکید | با **اندازه** و **letter-spacing**، نه با وزن Bold |

---

## 2. Color Tokens

| Token | Hex | کاربرد |
|-------|-----|--------|
| `canvas` | `#000000` | کف همه صفحات |
| `surface-soft` | `#0d0d0d` | ردیف‌های دیتا / پنل |
| `surface-card` | `#141414` | کارت‌های نادر محتوا |
| `surface-elevated` | `#1f1f1f` | سطوح تو در تو در پنل |
| `hairline` | `#262626` | جداکننده‌های ۱px |
| `hairline-strong` | `#3a3a3a` | زیرخط اینپوت |
| `ink` / `on-dark` | `#ffffff` | تیتر و متن اصلی |
| `body` | `#cccccc` | پاراگراف |
| `body-strong` | `#e6e6e6` | لید |
| `muted` | `#999999` | متادیتا، فوتر، تاریخ |
| `muted-soft` | `#666666` | کپی‌رایت / قانونی |
| `link` | `#c3d9f3` | تنها رنگ غیرمونوکروم — لینک اینلاین |
| `warning` | `#d4a017` | هشدار فنی (پنل) |
| `success` | `#5fa657` | تأیید (پنل) |

**ممنوع:** طلایی/ترراکوتا، بنفش، گرادیان بنفش، پس‌زمینه کرم.

---

## 3. Typography Trinity

| نقش | فونت | کاربرد |
|-----|------|--------|
| **Display** | Saira Condensed + Vazirmatn | تیترها، وردمارک MIG — uppercase لاتین / تیتر فارسی |
| **Text** | Cormorant Garamond + Vazirmatn | بدنهٔ متن |
| **Mono** | JetBrains Mono | دکمه‌ها، ناوبری، کپشن، تاریخ |

### مقیاس

| Token | Size | Tracking | وزن |
|-------|------|----------|-----|
| `display-xl` | clamp(32px, 6vw, 64px) | 0.06–0.08em | 400 |
| `display-lg` | 48px | 0.05em | 400 |
| `display-md` | 32px | 0.04em | 400 |
| `display-sm` | 24px | 0.03em | 400 |
| `wordmark` | 14px | 0.4em | 400 |
| `title-md` | 20px | 0.02em | 400 |
| `caption` | 11px | 0.15em | 400 · uppercase |
| `body-md` | 16px | 0 | 400 |
| `button` | 14px | 0.18em | 400 · uppercase |
| `nav-link` | 12px | 0.15em | 400 · uppercase |

**قانون:** وزن همیشه ۴۰۰. هیچ Bold در سیستم مارکتینگ.

---

## 4. Layout & Spacing

| Token | Value |
|-------|-------|
| xxs–xl | 4 / 8 / 12 / 16 / 24 / 40 / 64 |
| `section` | 120px بین بندهای اصلی |
| max content | 1280px |
| hero | full-bleed، بدون inset |

Whitespace عمداً سخاوتمند است — فشرده‌سازی ریتم برند را می‌شکند.

---

## 5. Shape System

| عنصر | Radius |
|------|--------|
| کارت، عکس، اینپوت، جداول | `0` |
| دکمه primary | `pill` (9999px) |
| دکمه آیکون | `full` (دایره) |

هیچ radius میانی (4/8/12) مجاز نیست.

---

## 6. Component Patterns

### `top-nav`
- ارتفاع ۵۶px، transparent روی هیرو
- وردمارک `MIG` مرکز با tracking وسیع
- لینک‌های Mono uppercase در دو سمت
- بدون backdrop blur سنگین / بدون border پررنگ

### `button-primary`
- پس‌زمینه transparent
- outline سفید ۱px
- pill · Mono uppercase · tracking 0.18em
- ارتفاع حداقل ۴۴px

### `hero-photo-band`
- عکاسی edge-to-edge
- یک تیتر Display · یک جملهٔ کوتاه · یک گروه CTA
- بدون badge، chip، stat strip روی هیرو

### `model-photo-card`
- عکس ۱۶:۹ · گوشه ۰
- نام محصول Display
- کپشن Mono
- لینک «کشف» بدون کارت سایه

### `spec-cell`
- مقدار بالا · برچسب Mono پایین
- جداکننده hairline

### `text-input`
- transparent · فقط underline hairline-strong
- فوکوس: خط سفید

### `cta-band-photo`
- بند پیش‌فوتر با عکس full-bleed + تیتر + یک دکمه

### `footer`
- canvas سیاه · ۴ ستون · muted · وردمارک پایین مرکز

---

## 7. Motion (حداقل ۲–۳ حرکت هدفمند)

1. **Hero reveal** — fade/slide آرام تیتر و CTA پس از لود
2. **Photo ken-burns** — scale بسیار ملایم روی هیرو (۱ → ۱.۰۴ در ۲۰s)
3. **Nav / link underline** — ظهور خط ۱px زیر لینک‌ها
4. **Section enter** — fade-up با intersection (اختیاری در صفحات بعدی)

بدون glow، بدون bounce، بدون پارالاکس شلوغ.

---

## 8. Admin / Panel Adaptations

همان پالت و تایپوگرافی، با تراکم بیشتر:

| الگوی پنل | رفتار |
|-----------|--------|
| Shell | `surface-soft` sidebar · `canvas` content |
| DataTable | ردیف‌های hairline · بدون سایه |
| Forms | underline inputs · دکمه outline pill |
| Status | فقط `warning` / `success` / `link` |
| Density | padding فشرده‌تر از مارکتینگ (۲۴px نه ۱۲۰px) |

---

## 9. Do / Don't

### Do
- هیرو همیشه full-bleed
- تیترهای لاتین uppercase با tracking
- دکمه transparent + outline
- فاصله ۱۲۰px بین بخش‌ها
- وزن ۴۰۰ همه‌جا

### Don't
- رنگ اکسنت طلایی/ترراکوتا روی مارکتینگ
- دکمه توپر سفید به‌عنوان primary
- کارت با shadow / radius در هیرو
- فشردن whitespace
- Bold روی Display

---

## 10. Page Rollout Order

1. Design tokens + Header/Footer/Button ← انجام‌شده در کد
2. Homepage (این فاز)
3. Products / Product detail
4. Projects / Services
5. Quote / Auth / Account
6. Admin shell + جداول
