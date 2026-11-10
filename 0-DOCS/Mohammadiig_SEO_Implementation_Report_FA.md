# گزارش اجرای اصلاحات سئوی گروه صنعتی محمدی

- **تاریخ:** ۱۰ نوامبر ۲۰۲۶
- **مخزن:** `Mohammadiig`؛ برنامه‌ی Next.js در `frontend`
- **محدوده:** تغییرات محلی و قابل بازبینی؛ بدون انتشار یا دسترسی تغییردهنده به production

## خلاصه

اصلاحات امن سئوی فنی در سورس پیاده شده‌اند: metadata و canonical مستقل برای صفحه‌های عمومی، رندر سمت سرورِ داده‌ی عمومی کاتالوگ/نمونه‌کار/جزئیات، sitemap پویا، noindex برای فرم درخواست قیمت، و OG از assetهای واقعی پروژه. رابط و CSS بازطراحی نشده‌اند، API یا داده‌ی محصول تغییر نکرده و حالت‌های loading موجود باقی مانده‌اند.

دسترسی شبکه به سایت production ممکن نبود و API محلی هم روی `127.0.0.1:3001` پاسخ نداد. بنابراین کد build شده و مسیر fallback محلی بررسی شده، اما محتوای زنده‌ی محصول/پروژه، redirectهای دامنه و metadata نهایی پس از اتصال به API در این اجرا قابل تأیید نبودند. گزارش، موارد نیازمند hosting و مالک را جدا می‌کند.

## ساختار و مسیرهای بررسی‌شده

نسخه‌ی موجود پروژه Next.js **16.3.4** و App Router است. داده‌های عمومی از API موجود خوانده می‌شوند؛ helperهای فعلی درخواست‌های `no-store` دارند. مدل‌ها و مسیرهای عمومی موجود شامل محصول، نمونه‌کار، پروژه‌ی منتشرشده و قطعه‌ی یدکی هستند. قرارداد API و backend تغییر نکرده است.

مسیرهای اصلی موجود در مخزن:

- `/`، `/products` و `/products/[slug]`
- `/portfolio` و `/portfolio/[slug]`
- `/projects` و `/projects/[slug]`
- `/services`، `/spare-parts` و `/spare-parts/[slug]`
- `/about`، `/contact` و `/quote-request`
- مسیرهای عملیاتی موجود از جمله `/auth`، `/account/profile`، `/admin`، `/cart` و `/checkout`

## تغییرهای انجام‌شده

### Metadata، canonical و OG

- صفحه‌های `/projects`، `/services` و `/spare-parts` metadata مستقل، canonical غیر www و OG از لوگوی موجود دریافت کردند.
- کاتالوگ `/products` عنوان، توضیح، canonical و OG دارد؛ تصویر OG از تصویر واقعی محصول در پاسخ API انتخاب می‌شود و در نبود داده از لوگوی موجود استفاده می‌شود.
- جزئیات محصول metadata را از همان محصول عمومی می‌سازند: نام مدل، توضیح منتشرشده، canonical و تصویر واقعی. Product JSON-LD فقط از داده‌های عمومی همان محصول ساخته می‌شود؛ Offer، قیمت، موجودی، review، rating و ویژگی ساختگی اضافه نشده‌اند.
- صفحه‌ی جزئیات پروژه metadata و تصویر را از پروژه‌ی منتشرشده می‌گیرد و فقط فیلدهای مورد نیاز صفحه به client تحویل می‌شود.
- صفحه‌ی فهرست نمونه‌کارها OG را از تصویر نمونه‌کار عمومی/ویژه می‌سازد؛ صفحه‌ی جزئیات نمونه‌کار و schema موجود آن حفظ شدند.
- عنوان صفحه‌های درباره‌ما و تماس به‌صورت absolute تنظیم شد تا نام سایت دوبار به title افزوده نشود. صفحه‌ی اصلی نیز OG خود را از asset واقعی لوگو می‌گیرد.
- جزئیات قطعات یدکی metadata را از قطعه‌ی عمومی موجود می‌سازند. رکورد غیرفعال یا خطای دریافت، index نمی‌شود.
- تصویر کارت پروژه در `/projects` متن جایگزین را از نام واقعی همان پروژه می‌گیرد؛ تصویر پس‌زمینه‌ی hero و thumbnailهای داخل ناحیه‌ی `aria-hidden` تزئینی باقی مانده‌اند.
- fallback صفحه‌های جزئیات محصول، پروژه و قطعه‌ی یدکی `noindex` است؛ canonical fallback پروژه و قطعه نیز به مسیر درخواست‌شده اشاره می‌کند.

### HTML اولیه و حفظ رابط

- صفحه‌های کاتالوگ و نمونه‌کار داده‌ی اولیه را در سرور از helperهای API موجود می‌گیرند. صفحه‌ی جزئیات محصول و پروژه نیز داده‌ی اولیه را به client موجود می‌دهند.
- مؤلفه‌های client جدا شده‌اند تا metadata و HTML در سرور ساخته شود. در صورت دریافت داده‌ی اولیه، درخواست تکراری اولیه حذف می‌شود؛ درخواست‌های بعدی و رفتار موجود فیلتر/صفحه‌بندی دست‌نخورده مانده‌اند.
- markup، classها، CSS، layout، انیمیشن‌ها، فرم‌ها، cart، auth و قراردادهای API بازطراحی یا تغییر داده نشده‌اند. loadingهای فعلی در حالت نبود داده حفظ شده‌اند.
- رفتارها و ظاهر در screenshot موبایل/دسکتاپ مقایسه نشدند؛ ابزار capture بصری در دسترس نبود. آزمون browser موجود HTTP smoke است، نه آزمون تصویری.

### Sitemap و indexability

- `sitemap.xml` اکنون مسیرهای عمومی ثابت شامل `/`، `/portfolio`، `/products`، `/projects`، `/services`، `/spare-parts`، `/about` و `/contact` را دارد و از API عمومی، جزئیات محصول/پروژه/نمونه‌کار/قطعه را پویا اضافه می‌کند.
- URL تکراری حذف می‌شود؛ `lastmod` فقط برای نمونه‌کار با تاریخ به‌روزرسانی واقعی درج می‌شود. URLهای queryدار یا priority ساختگی تولید نمی‌شوند.
- `/quote-request` به‌دلیل فرم عملیاتی و محتوای مستقل کم، `noindex,follow` و خارج از sitemap شد.
- `/auth` و `/account/profile` همچنان `noindex,nofollow` هستند و محدودیت `/admin` در `robots.txt` حفظ شد. cart، checkout و مسیرهای خصوصی وارد sitemap نمی‌شوند.
- در بررسی محلی با API خاموش، sitemap شامل ۸ مسیر عمومی ثابت بود؛ نبود مسیرهای داینامیک در همان اجرا به معنی تأیید کامل sitemap production نیست.

### فایل‌های تغییرکرده در frontend

- `src/app/page.tsx`
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/products/page.tsx`
- `src/app/products/[slug]/page.tsx`
- `src/app/products/[slug]/ProductDetailClient.tsx` (جدید؛ انتقال UI کلاینت موجود)
- `src/components/ProductsCatalog.tsx`
- `src/app/portfolio/layout.tsx`
- `src/app/portfolio/page.tsx`
- `src/app/portfolio/PortfolioClient.tsx` (جدید؛ انتقال UI کلاینت موجود)
- `src/app/projects/layout.tsx` (جدید)
- `src/app/projects/page.tsx`
- `src/app/projects/[slug]/page.tsx`
- `src/app/projects/[slug]/ProjectDetailClient.tsx` (جدید؛ انتقال UI کلاینت موجود)
- `src/app/services/layout.tsx` (جدید)
- `src/app/spare-parts/layout.tsx` (جدید)
- `src/app/spare-parts/[slug]/layout.tsx` (جدید)
- `src/app/quote-request/layout.tsx`
- `src/app/sitemap.ts`
- `test/interactive-pages.test.cjs` (به‌روزرسانی فهرست sourceهای client پس از جداسازی server/client؛ suite جدید اضافه نشد)

این گزارش فایل جدید `0-DOCS/Mohammadiig_SEO_Implementation_Report_FA.md` است. سند ورودی `0-DOCS/Mohammadiig_SEO_Implementation_Spec_FA.md` و تغییرهای موجود در `Data/` و `backend/` دست‌نخورده ماندند.

## نتیجه‌ی بررسی محلی

بررسی با build production محلی روی `http://127.0.0.1:3327` انجام شد؛ همه‌ی routeهای درخواست‌شده در جدول با HTTP 200 برگشتند. این نتایج وضعیت production یا پاسخ داده‌های API را اثبات نمی‌کنند.

| Route                          | Title / canonical / robots                       |           H1 در HTML اولیه |
| ------------------------------ | ------------------------------------------------ | -------------------------: |
| `/`                            | مستقل؛ canonical دامنه‌ی بدون www؛ index         |                          ۱ |
| `/products`                    | عنوان و canonical مستقل؛ index                   |                          ۱ |
| `/portfolio`                   | عنوان و canonical مستقل؛ index                   |                          ۱ |
| `/projects`                    | عنوان و canonical مستقل؛ index                   |                          ۱ |
| `/services`                    | عنوان و canonical مستقل؛ index                   |                          ۱ |
| `/spare-parts`                 | عنوان و canonical مستقل؛ index                   |                          ۱ |
| `/about`، `/contact`           | title بدون suffix تکراری؛ canonical مستقل؛ index |                   هرکدام ۱ |
| `/quote-request`               | canonical مستقل؛ `noindex,follow`                |      ۰؛ صفحه‌ی فرم عملیاتی |
| `/products/bugatti-bumper-car` | fallback عمومی؛ بدون canonical؛ `noindex,follow` | ۰؛ API محصول در دسترس نبود |
| `/projects/test-project`       | canonical همان مسیر؛ `noindex,follow`            | ۰؛ API پروژه در دسترس نبود |
| `/spare-parts/test-part`       | canonical همان مسیر؛ `noindex,follow`            |  ۰؛ API قطعه در دسترس نبود |
| `/auth`، `/account/profile`    | `noindex,nofollow` حفظ شد                        |                          ۰ |

`robots.txt` محلی HTTP 200 داشت، `Disallow: /admin` و نشانی sitemap canonical را شامل می‌شد. XML مربوط به sitemap parse شد، ۸ URL عمومی ثابت داشت و هیچ URL خصوصی/noindex در آن نبود. در حالت API خاموش، فهرست‌های محصول/نمونه‌کار و داده‌ی جزئیات در HTML اولیه قابل تأیید نبودند؛ fallback موجود client loader را نمایش می‌دهد.

### Build، lint و آزمون‌ها

- `npm.cmd run typecheck` — موفق.
- `npm.cmd run build` — موفق؛ ۵۱ صفحه‌ی static تولید شد و مسیرهای متکی بر داده‌ی زنده به‌صورت dynamic علامت‌گذاری شدند.
- `npm.cmd run test:contract` — موفق، ۵ از ۵.
- `npm.cmd run test:interactive` — موفق، ۱۹ از ۱۹.
- `npm.cmd run test:browser` — موفق، ۳ از ۳؛ HTTP smoke، بدون screenshot بصری.
- `npm.cmd run lint` — ناموفق: ۴ خطا و ۲۵ هشدار در کل پروژه. خطاها خارج از تغییرهای SEO هستند: سه مورد `require()` در `frontend/.gitnexus/run.cjs` و یک مورد `Date.now()` در `src/app/admin/data-entry-tokens/page.tsx`. فایل‌های admin و `.gitnexus/run.cjs` در این تغییر ویرایش نشدند.
- بررسی focused lint فایل‌های SEO خطای تازه نداشت؛ یک هشدار accessibility در markup موجود گالری محصول باقی است (`aria-pressed` روی `role="listitem"`). تغییر آن برای این کار ریسک تغییر معنای کنترل داشت و انجام نشد.
- فایل‌های سورس تغییرکرده با Prettier قالب‌بندی شدند.

### تحلیل وابستگی GitNexus

- تحلیل نهایی فرانت‌اند روی ۱۲ فایل، ۱۱۲ نماد و ۱۸ مسیر اجرایی اثر نشان داد و برچسب ریسک آن **CRITICAL** است. مسیرهای برجسته شامل دریافت مشخصات/مدل‌های محصول، دریافت صفحه‌بندی محصولات و دسته‌ها، افزودن محصول و قطعه به sitemap و ساخت metadata با helperهای canonical/media هستند. این مسیرها در محدوده‌ی SEO تغییر کرده‌اند و به همین دلیل هشدار در این گزارش حفظ شده است؛ آن را به‌عنوان ریسک پایین تلقی نکرده‌ام.
- context مستقیم تأیید کرد که صفحه‌ی محصول از helperهای دریافت محصول/مشخصات/مدل، صفحه‌ی فهرست از helperهای عمومی محصولات/دسته‌ها، sitemap از endpointهای عمومی و URL helperها استفاده می‌کند. در controllerهای موجود، API عمومی محصولات فقط موارد فعال و حذف‌نشده را برمی‌گرداند؛ endpoint عمومی نمونه‌کار/پروژه فقط موارد منتشرشده را برمی‌گرداند؛ endpoint قطعه‌ی یدکی endpoint عمومی جدا از مسیرهای admin دارد.
- build، typecheck، آزمون‌های contract/interactive/browser و smoke محلی routeها اجرا شدند؛ بااین‌حال داده‌ی واقعی API محلی در دسترس نبود. ارزیابی این هشدار جای بررسی زنده‌ی پس از تنظیم API/hosting را نمی‌گیرد.
- خودِ تحلیل GitNexus هنگام ساخت index اعلام کرد که فقط ۳۹۳ جریان از ۶۴۵ ورودی کاندیدا trace شده و مسیرهایی حذف شده‌اند. بنابراین از نبودن یک flow در خروجی نتیجه‌ی «بدون اثر» نگرفته‌ام. خروجی detect-changes نیز بخش عمده‌ی نمادها/جریان‌ها را خلاصه می‌کرد.
- تحلیل root هم ۱۵ تغییر در `Data/` و سند فارسی کاربر را دید و هیچ نماد index‌شده‌ای را در آن hunks پیدا نکرد؛ آن تغییرها در این کار دست‌نخورده ماندند.

## موارد نیازمند hosting یا تأیید مالک

### Hosting / CDN / محیط اجرا

1. در repository تنظیم قابل مشاهده‌ای برای redirect دامنه وجود ندارد؛ `next.config.ts` فقط rewriteهای API و media را تعریف می‌کند. در hosting/CDN هر چهار حالت `http://mohammadiig.ir`، `http://www.mohammadiig.ir`، `https://www.mohammadiig.ir` و میزبان‌های مشابه باید در یک redirect دائمی مستقیم به `https://mohammadiig.ir/{path}?{query}` بروند؛ path و query حفظ شوند و redirect chain ساخته نشود. وضعیت فعلی production به‌علت عدم دسترسی شبکه قابل تأیید نبود.
2. متغیر موجود `API_INTERNAL_URL` باید در runtime سرور به API قابل‌دسترسی اشاره کند تا SSR و sitemap بتوانند داده‌ی عمومی را دریافت کنند. مقدار fallback کد `http://127.0.0.1:3001/api` است که در این اجرای محلی connection refused داد. `NEXT_PUBLIC_API_URL` نیز فقط مطابق تنظیم فعلی کلاینت سایت تنظیم شود؛ secret به آن منتقل نشود. هیچ متغیر یا credential جدیدی در این تغییر تعریف نشده است.
3. پس از اعمال تنظیمات، از محیط staging یا production (با مجوز عملیاتی جداگانه) status/redirect همه‌ی variantهای دامنه، HTML اولیه‌ی چند محصول و پروژه‌ی واقعی، sitemap داینامیک و JSON-LD بررسی شود. این کار در این تغییر انجام نشده و هیچ deploy، DNS، CDN یا انتشار production صورت نگرفته است.

### تأیید مالک / تکمیل داده

1. طبق audit ورودی، فیلدهای رنگ، ابعاد، وزن و متریال برای برخی محصولات خالی یا خط تیره بوده‌اند. مقدار فعلی API در این اجرا قابل دریافت نبود؛ هیچ‌یک حذف یا با مقدار ساختگی پر نشده‌اند. مقدار معتبر هر مدل باید از مالک/منبع محصول تأیید شود.
2. ادعای «بیش از ۴۰ سال سابقه» در صفحه‌ی اصلی با آغاز مسیر در سال ۱۳۸۱ در صفحه‌ی درباره‌ما نیاز به تعیین عبارت/سال مورد تأیید مالک دارد؛ هیچ‌کدام بازنویسی نشد.
3. میزبان canonical نهایی در تنظیمات کد `https://mohammadiig.ir` است و با نمونه‌ی canonical ممیزی هم‌خوانی دارد؛ مالک باید این انتخاب بدون www را برای دامنه تأیید کند.
4. شناسه‌ی Search Console، Analytics و Merchant Center در کد اضافه نشده است. اتصال حساب‌ها و تأیید مالک سایت خارج از scope این تغییر است.

موضوع‌هایی مانند «راهنمای انتخاب ماشین کوبنده»، «مراحل نصب و راه‌اندازی پیست» و «نگهداری قطعات» فقط پیشنهاد برای برنامه‌ریزی محتوای آینده‌اند؛ تا وقتی محتوای فنی معتبر و تأییدشده فراهم نشود، صفحه یا ادعای تازه‌ای منتشر نشده است.

## تحویل Git

تغییرهای SEO در frontend و گزارش این سند آماده‌ی بازبینی‌اند. وضعیت Git اولیه شامل تغییرهای جداگانه‌ی کاربر در `Data/`، سند audit ورودی و دایرکتوری `backend/` بود؛ این موارد در scope این کار قرار نگرفتند و نباید stage شوند. چیزی push یا deploy نشده است.
