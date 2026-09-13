# استقرار MIG روی PaaS / هاست Node.js (پارس‌پک)

این پروژه سه سرویس جدا می‌خواهد:

| سرویس | قالب در PaaS | Context dir | دامنه پیشنهادی |
|--------|---------------|-------------|----------------|
| دیتابیس | PostgreSQL | — | داخلی |
| API | Node.js | `backend` | `api.mohammadiig.ir` |
| سایت | **Next.js** (نه Node خام) | `frontend` | `mohammadiig.ir` |

مرجع محصول: [PaaS پارس‌پک](https://parspack.com/paas) · [مستندات](https://docs.parspack.com/paas/)

---

## ۱) PostgreSQL

1. در پروژه PaaS یک دیتابیس PostgreSQL بسازید (نام مثلاً `mig`).
2. از پنل، Host / Port / User / Password را بردارید.
3. رشته اتصال:

```text
postgresql://USER:PASSWORD@HOST:PORT/mig
```

---

## ۲) بک‌اند Nest (`backend`)

### دستورات پنل
- **Build:** `npm install && npm run build`
- **Start:** `npm start`
- **Node:** 20+
- پورت پارس‌پک معمولاً `3000` است؛ متغیر `PORT` را پلتفرم می‌دهد.

### متغیرهای محیطی

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=https://mohammadiig.ir,https://www.mohammadiig.ir
JWT_SECRET=<حداقل-۳۲-کاراکتر-تصادفی>
DB_DRIVER=postgres
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/mig
MEDIA_ROOT=/data/media
# Leave empty — store relative /media/... in DB (do not use localhost absolute URLs)
# MEDIA_PUBLIC_BASE_URL=
```

نمونه کامل: `backend/.env.example`

### OTP / پیامک پارس‌گرین
برای ورود و ثبت‌نام مشتریان با موبایل:

```env
PARSGREEN_API_KEY=<کلید-وب‌سرویس-از-پنل>
PARSGREEN_ADD_NAME=true
PARSGREEN_DRY_RUN=false
PARSGREEN_DEBUG=false
OTP_TTL_SECONDS=120
OTP_RESEND_SECONDS=60
```

کلید از پنل پارس‌گرین → وب سرویس → تولید API Key. متد: `POST https://sms.parsgreen.ir/Apiv2/Message/SendOtp`

### ماندگاری فایل‌های رسانه (مهم)
آپلودهای کتابخانه تصاویر در مسیر `MEDIA_ROOT` ذخیره می‌شوند. روی PaaS این مسیر باید روی **دیسک/Volume پایدار** باشد، وگرنه با Redeploy فایل‌ها پاک می‌شوند.

پیشنهاد:
1. یک Persistent Volume (مثلاً `/data`) به اپ بک‌اند وصل کنید.
2. `MEDIA_ROOT=/data/media` بگذارید.
3. `MEDIA_PUBLIC_BASE_URL` را خالی بگذارید تا در دیتابیس فقط مسیر نسبی `/media/...` ذخیره شود (آدرس مطلق `localhost` روی موبایل می‌شکند).
4. از پنل ادمین → کتابخانه تصاویر، بک‌آپ ZIP بگیرید و جایی امن نگه دارید.

### نکات
- اپ روی `0.0.0.0` گوش می‌دهد (سازگار با کانتینر).
- `FRONTEND_URL` می‌تواند چند origin با ویرگول باشد (CORS).
- مایگریشن‌ها هنگام استارت با TypeORM اجرا می‌شوند (`migrationsRun`).
- دسترسی پنل ادمین فقط نقش `admin` است (فرانت + API).
- فایل‌های رسانه از مسیر استاتیک `https://api…/media/…` سرو می‌شوند (خارج از `/api`).

دامنه `api.mohammadiig.ir` را به این اپ وصل کنید. تست: `https://api.mohammadiig.ir/api`

---

## ۳) فرانت Next (`frontend`)

### دستورات پنل
- قالب: **Next.js**
- **Build:** `npm install && npm run build`
- **Start:** `npm start` (با `--hostname 0.0.0.0`)

### متغیر محیطی (قبل از Build)

```env
NEXT_PUBLIC_API_URL=https://api.mohammadiig.ir/api
```

نمونه: `frontend/.env.example`

> `NEXT_PUBLIC_*` در زمان build داخل باندل می‌رود؛ بعد از عوض کردن حتماً Rebuild کنید.

دامنه اصلی را به این اپ بدهید.

---

## ۴) ترتیب بالا آوردن

1. Postgres Up  
2. Backend Up و لاگ بدون خطای DB  
3. Frontend Build + Up  
4. لاگین Admin → `/admin` · کاربر عادی → `/account`

---

## لوکال (تفاوت)

| | لوکال | پروداکشن PaaS |
|--|--------|----------------|
| DB | SQLite | PostgreSQL |
| API port | 3001 | 3000 (یا PORT پلتفرم) |
| API URL فرانت | `http://localhost:3001/api` | `https://api…/api` |
