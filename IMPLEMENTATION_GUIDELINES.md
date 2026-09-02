# 🏭 MIG - IMPLEMENTATION GUIDELINES
## قوانین جامع پیاده‌سازی برای تمام AI Agents

---

## 📋 **فهرست مطالب**

1. [معلومات پروژه - Project Context](#project-context)
2. [معماری کلی - Architecture](#architecture)
3. [قوانین Theme System](#theme-system)
4. [قوانین Database Schema](#database-schema)
5. [قوانین Nest.js Backend](#nestjs-backend)
6. [قوانین Next.js Frontend](#nextjs-frontend)
7. [قوانین کدنویسی و سبک](#coding-standards)
8. [قوانین AI Agent](#ai-agent-rules)

---

## 🏢 PROJECT CONTEXT

### Project Identity
- **نام برند اصلی:** MIG (Mohammadi Industrial Group)
- **نام برند عملیاتی:** Funtino
- **حوزه تخصصی:** تولید و بهره‌برداری از تجهیزات شهربازی (ماشین کوبنده)
- **مدل کسب‌وکار:** Manufacturing + Operations + Investment/Partnership

### Business Model (سه ستون اصلی)

```
MIG (گروه صنعتی محمدی)
│
├─ MANUFACTURING (تولید صنعتی)
│  ├─ پیست ماشین کوبنده (تمام اندازه‌ها و طراحی‌ها)
│  ├─ ماشین کوبنده بزرگسال (3+ مدل)
│  ├─ ماشین کوبنده کودکان (2 مدل)
│  └─ قطعات یدکی و Spare Parts
│
├─ OPERATIONS (بهره‌برداری عملیاتی)
│  └─ Funtino Brand
│     └─ شهربازی‌ها (Frozen Park, Arjomandi VR Park)
│
└─ INVESTMENT (سرمایه‌گذاری و شراکت)
   ├─ تجهیز پروژه جدید
   ├─ راه‌اندازی شهربازی
   └─ شراکت و بهره‌برداری مشترک
```

### Key Verified Facts
- ✅ تیم: 15+ نفر (حرفه‌ای)
- ✅ پروژه‌های واقعی: Frozen Park، Arjomandi VR Park
- ✅ حضور بین‌المللی: ATRAX Exhibition (Turkey 2024)
- ✅ گواهینامه دولتی: موجود (تاریخ: 1399/02/20)
- ✅ ارتباطات: +989301255520 / +989123026843

### Pending Information (نیاز به تأیید)
- سال تأسیس MIG و Funtino
- آدرس دقیق کارخانه
- مساحت و ظرفیت تولید
- لیست کامل پروژه‌ها

---

## 🏗️ ARCHITECTURE

### Technology Stack

**Frontend:**
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- State Management: Zustand
- Validation: Zod + React Hook Form
- UI Animation: Framer Motion
- SEO: Next-SEO + Built-in Metadata

**Backend:**
- Framework: Nest.js 10+
- Language: TypeScript
- Database: PostgreSQL (Primary) | SQLite (Development)
- ORM: TypeORM
- API Documentation: Swagger/OpenAPI
- Authentication: JWT + Passport.js
- Validation: Class-Validator

**DevOps:**
- Hosting: cPanel (معمول)
- Process Manager: PM2
- Reverse Proxy: Nginx
- SSL: Let's Encrypt
- Environment: Node.js 18+

### Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│          Browser / Client (User)                 │
└────────────────────┬────────────────────────────┘
                     │ HTTPS:443
                     ▼
        ┌────────────────────────┐
        │  Nginx Reverse Proxy   │
        │  (cPanel / Apache)     │
        └────────────────────────┘
         │                    │
    ┌────▼──────────┐    ┌───▼──────────┐
    │  Next.js App  │    │  Nest.js API │
    │  Port:3000    │    │  Port:3001   │
    └────┬──────────┘    └───┬──────────┘
         │                    │
         └────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   PostgreSQL DB     │
        │  (127.0.0.1:5432)   │
        └─────────────────────┘
```

---

## 🎨 THEME SYSTEM

### Principle: Centralized Theme Management

تمام رنگ‌ها، فونت‌ها و استایل‌های UI از یک منبع متمرکز (theme.config.ts) تغذیه می‌شوند.

### Purpose
- ✅ تغییر سراسری تم بدون تغییر کامپوننت‌ها
- ✅ سازگاری و consistency در کل اپلیکیشن
- ✅ آماده‌سازی برای Admin Panel (آینده)
- ✅ پشتیبانی از Light/Dark Mode

### File Structure

```
src/
├─ config/
│  └─ theme.config.ts          # Theme central configuration
├─ store/
│  └─ theme.store.ts           # Zustand theme state
├─ hooks/
│  └─ useTheme.ts              # React hook for theme usage
└─ components/
   └─ Button.tsx               # Example: theme-aware component
```

### Theme Configuration Structure

```typescript
themeConfig = {
  colors: {
    primary: { 50-900 },        // Main brand colors
    secondary: { 50-900 },      // Accent colors
    success: { 50-900 },        // Success/positive
    error: { 50-900 },          // Error/danger
    warning: { 50-900 },        // Warning/caution
    neutral: { 50-900 },        // Gray scale
    mig: {                       // Brand-specific
      darkBlue: '#1a1f3a',
      accentGold: '#d4a574',
      steel: '#5a6c7d'
    }
  },
  typography: {
    fontFamily: { sans, serif, mono },
    fontSize: { xs-5xl },
    fontWeight: { thin-black }
  },
  spacing: { 0-32 },            // Padding/margin scale
  borders: {
    radius: { none-full },
    width: { sm-lg }
  },
  shadows: { none-2xl },
  transitions: {
    duration: { fast-slower },
    easing: { linear, in, out, inOut }
  },
  breakpoints: { xs-2xl },      // Responsive design
  components: {                 // Component defaults
    button: { ... },
    card: { ... },
    input: { ... },
    header: { ... },
    footer: { ... }
  }
}
```

### Implementation Rules for Agents

#### Rule TH-1: Never Hardcode Colors
❌ **WRONG:**
```typescript
<div style={{ color: '#5470ff' }} />
```

✅ **CORRECT:**
```typescript
const { colors } = useTheme()
<div style={{ color: colors.primary[500] }} />
// یا Tailwind:
<div className="text-primary-500" />
```

#### Rule TH-2: Use Provided Component Defaults
```typescript
// Button should use theme defaults
<Button variant="solid" color="primary" size="md" />
// All styling from theme.config.ts
```

#### Rule TH-3: Responsive Design via Tailwind
```typescript
// Use theme breakpoints
<div className="px-4 md:px-8 lg:px-16" />
// Based on: sm:640px, md:768px, lg:1024px from theme
```

#### Rule TH-4: Consistency in Spacing
```typescript
// Always use theme spacing scale
padding: spacing[4]      // 16px (base unit = 4px)
margin: spacing[6]       // 24px
gap: spacing[3]          // 12px
```

#### Rule TH-5: Component Styling Pattern

```typescript
interface ComponentProps {
  variant?: 'solid' | 'outline' | 'ghost'
  color?: 'primary' | 'secondary' | 'success' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export const Component = (props: ComponentProps) => {
  const theme = useTheme()
  // Use theme object to determine classes
}
```

---

## 💾 DATABASE SCHEMA

### Design Principles for E-Commerce / B2B

#### Principle 1: Flexibility for Custom Orders
- ✅ سفارشات پیست‌های متنوع (اندازه، طراحی، رنگ)
- ✅ ترکیبات مختلف ماشین‌های کوبنده
- ✅ خدمات اضافی (نصب، تعمیر، آموزش)
- ✅ قطعات یدکی و جانبی

#### Principle 2: Support B2B Operations
- ✅ نقل‌قول کاستم (Custom Quotations)
- ✅ تاریخچه خریدار
- ✅ شرایط پرداخت مختلف
- ✅ داشبورد پروژه

#### Principle 3: Scalability & Performance
- ✅ Indexing برای جستجوی سریع
- ✅ Soft delete برای audit trail
- ✅ Timestamps برای تاریخچه
- ✅ Relationships برای data integrity

### Core Tables Structure

```
┌─────────────────────────────────────────────────┐
│              DATABASE SCHEMA                     │
└─────────────────────────────────────────────────┘

CORE ENTITIES:
├─ users
├─ customers (B2B customers)
├─ products (محصولات)
├─ product_categories
├─ product_variants (مدل‌های مختلف)
├─ product_specifications (مشخصات فنی)
├─ spare_parts (قطعات یدکی)
├─ orders (سفارشات)
├─ order_items (آیتم‌های سفارش)
├─ order_customizations (تخصیص‌ها)
├─ quotations (نقل‌قول‌های کاستم)
├─ projects (پروژه‌های شراکتی)
├─ project_phases (مراحل پروژه)
├─ services (خدمات اضافی)
├─ invoices (فاکتورها)
├─ payments (پرداخت‌ها)
└─ attachments (فایل‌های ضمیمه)
```

### Detailed Table Designs

#### 1. **users** - کاربران سیستم
```sql
users:
  id (PK, UUID)
  email (UNIQUE, NOT NULL)
  password_hash (NOT NULL)
  first_name
  last_name
  role (admin | customer | sales | support)
  phone
  company_name (برای B2B)
  avatar_url
  is_active (BOOLEAN, default: true)
  last_login_at
  created_at (TIMESTAMP)
  updated_at (TIMESTAMP)
  deleted_at (TIMESTAMP - soft delete)
```

#### 2. **customers** - مشتریان B2B
```sql
customers:
  id (PK, UUID)
  user_id (FK → users)
  company_name (نام شرکت)
  company_registration_number (شماره ثبت)
  industry (صنعت: Amusement Park, Entertainment, etc.)
  country
  city
  address
  phone
  contact_person
  website
  credit_limit (حد اعتباری)
  payment_terms (شرایط پرداخت: Net 30, Net 60, etc.)
  tax_id
  preferred_currency
  is_verified (تأیید شده)
  notes
  created_at
  updated_at
  deleted_at
```

#### 3. **products** - محصولات اصلی
```sql
products:
  id (PK, UUID)
  name_en / name_fa
  slug (برای URL)
  category_id (FK → product_categories)
  description_short
  description_long
  technical_specs (JSON: {power, dimensions, weight, etc.})
  price_base (قیمت پایه - واحد: ریال یا $)
  currency (USD, EUR, IRR)
  sku (Stock Keeping Unit)
  is_active
  is_customizable (آیا قابل سفارش کاستم)
  thumbnail_image_url
  images (JSON array: [url1, url2, ...])
  warranty_months
  lead_time_days (زمان تحویل معمول)
  manufacturer_code (کد تولیدکننده)
  created_at
  updated_at
  deleted_at
```

#### 4. **product_categories** - دسته‌بندی محصولات
```sql
product_categories:
  id (PK, UUID)
  name_en / name_fa
  slug
  description
  icon_url
  parent_category_id (FK - برای subcategories)
  display_order
  is_active
  created_at
  updated_at
```

#### 5. **product_variants** - نسخه‌های مختلف محصول
```sql
product_variants:
  id (PK, UUID)
  product_id (FK → products)
  variant_name (مثال: "Model A - Red", "Model B - Blue")
  sku_variant
  specifications (JSON: تفاوت‌های خاص)
  price_adjustment (قیمت اضافی نسبت به پایه)
  stock_quantity
  images (JSON array)
  is_active
  created_at
  updated_at
```

#### 6. **product_specifications** - مشخصات فنی جزئی
```sql
product_specifications:
  id (PK, UUID)
  product_id (FK → products)
  specification_key (مثال: "power_hp", "max_speed_kmh")
  specification_value (مثال: "50", "80")
  unit (مثال: "HP", "km/h", "kg")
  display_order
  spec_category (Engine, Dimensions, Safety, etc.)
  created_at
  updated_at
```

#### 7. **spare_parts** - قطعات یدکی
```sql
spare_parts:
  id (PK, UUID)
  name_en / name_fa
  description
  part_number (شماره قطعه اصلی)
  compatible_products (JSON array: [product_ids])
  price
  currency
  stock_quantity
  reorder_level
  supplier_id (FK → suppliers)
  image_url
  warranty_months
  is_active
  created_at
  updated_at
  deleted_at
```

#### 8. **orders** - سفارشات
```sql
orders:
  id (PK, UUID)
  order_number (UNIQUE: ORD-YYYY-MM-XXXXX)
  customer_id (FK → customers)
  order_date
  required_delivery_date
  actual_delivery_date
  status (pending | processing | manufactured | shipped | delivered | cancelled)
  order_type (standard | custom | project)
  total_amount
  currency
  tax_amount
  shipping_cost
  payment_status (unpaid | partial | paid | overdue)
  notes (یادداشت‌های ویژه)
  shipping_address (JSON)
  billing_address (JSON)
  created_at
  updated_at
  deleted_at
```

#### 9. **order_items** - آیتم‌های سفارش
```sql
order_items:
  id (PK, UUID)
  order_id (FK → orders)
  product_id (FK → products)
  product_variant_id (FK → product_variants, nullable)
  quantity
  unit_price
  line_total (quantity × unit_price)
  customizations_json (JSON: رنگ، اندازه، خصوصیات)
  delivery_phase (Phase 1, Phase 2, etc.)
  status (pending | ready | shipped | delivered)
  created_at
  updated_at
```

#### 10. **order_customizations** - تخصیص‌های سفارش کاستم
```sql
order_customizations:
  id (PK, UUID)
  order_item_id (FK → order_items)
  customization_type (color | size | design | material | other)
  customization_value
  customization_description
  additional_cost
  is_approved
  notes
  created_at
  updated_at
```

#### 11. **quotations** - نقل‌قول‌های کاستم (پیش‌ فاکتور)
```sql
quotations:
  id (PK, UUID)
  quotation_number (UNIQUE: QT-YYYY-MM-XXXXX)
  customer_id (FK → customers)
  issued_date
  valid_until (تاریخ انقضا)
  quoted_by (user_id - فروشنده)
  total_amount
  currency
  items (JSON array: [{product_id, quantity, price, specs}])
  terms_and_conditions
  notes
  status (draft | sent | accepted | rejected | expired)
  created_at
  updated_at
```

#### 12. **projects** - پروژه‌های سرمایه‌گذاری / شراکت
```sql
projects:
  id (PK, UUID)
  project_name
  project_code (UNIQUE: PRJ-YYYY-XXXXX)
  customer_id (FK → customers)
  project_type (partnership | investment | equipment_supply)
  location (شهر / کشور)
  description
  start_date
  expected_completion_date
  actual_completion_date
  budget_total
  currency
  budget_spent
  status (planning | in_progress | on_hold | completed | cancelled)
  investment_percentage (درصد سرمایه‌گذاری MIG)
  profit_sharing_percentage (درصد سود)
  documents (JSON: [contract_url, agreement_url, ...])
  created_at
  updated_at
```

#### 13. **project_phases** - مراحل پروژه
```sql
project_phases:
  id (PK, UUID)
  project_id (FK → projects)
  phase_number (1, 2, 3, ...)
  phase_name (مثال: Design, Manufacturing, Installation)
  start_date
  end_date
  status (pending | in_progress | completed)
  deliverables (JSON: [{name, description}])
  created_at
  updated_at
```

#### 14. **services** - خدمات اضافی
```sql
services:
  id (PK, UUID)
  name_en / name_fa
  category (installation | training | maintenance | support)
  description
  base_price
  currency
  unit_type (per_hour | per_day | per_visit | fixed)
  is_active
  created_at
  updated_at
```

#### 15. **invoices** - فاکتورها
```sql
invoices:
  id (PK, UUID)
  invoice_number (UNIQUE: INV-YYYY-MM-XXXXX)
  order_id (FK → orders, nullable)
  quotation_id (FK → quotations, nullable)
  customer_id (FK → customers)
  invoice_date
  due_date
  total_before_tax
  tax_rate
  tax_amount
  total_after_tax
  currency
  payment_status (pending | partial | paid | overdue)
  notes
  attachments (JSON: [file_urls])
  created_at
  updated_at
```

#### 16. **payments** - ثبت پرداخت‌ها
```sql
payments:
  id (PK, UUID)
  invoice_id (FK → invoices)
  order_id (FK → orders)
  payment_date
  amount
  currency
  payment_method (bank_transfer | credit_card | check | cash)
  transaction_id (شماره تراکنش)
  payment_status (pending | completed | failed)
  notes
  receipt_url
  created_at
```

#### 17. **attachments** - فایل‌های ضمیمه
```sql
attachments:
  id (PK, UUID)
  owner_type (Order | Quotation | Project | Invoice)
  owner_id (FK - UUID)
  file_name
  file_url
  file_size (bytes)
  file_type (PDF, Image, Document, etc.)
  uploaded_by (user_id)
  uploaded_at
```

### Indexing Strategy

```sql
-- Performance critical indexes:
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status);

-- Search indexes:
CREATE INDEX idx_products_name ON products(name_fa, name_en);
CREATE INDEX idx_customers_company ON customers(company_name);
```

### Database Rules for Agents

#### Rule DB-1: Soft Deletes
```typescript
// NEVER use hard delete. Always use soft delete:
deleted_at: TIMESTAMP (NULL = not deleted)

// Query مثال:
SELECT * FROM products WHERE deleted_at IS NULL;
```

#### Rule DB-2: Timestamps for Audit Trail
```typescript
// تمام جداول باید داشته باشند:
created_at: TIMESTAMP (NOT NULL)
updated_at: TIMESTAMP (NOT NULL)
deleted_at: TIMESTAMP (nullable)
```

#### Rule DB-3: JSON Fields for Flexibility
```typescript
// For custom data that may vary:
// ✅ specifications_json
// ✅ customizations_json
// ✅ shipping_address_json
// ❌ Do NOT create separate tables for every variation
```

#### Rule DB-4: Currency Support
```typescript
// تمام جداول قیمتی داشته باشند:
price (DECIMAL 18,2)
currency (VARCHAR: 'USD', 'EUR', 'IRR', etc.)
```

#### Rule DB-5: Relations Integrity
```typescript
// Foreign Keys باید always setup باشند:
CONSTRAINT fk_order_customer 
  FOREIGN KEY (customer_id) REFERENCES customers(id)
  ON DELETE RESTRICT
  ON UPDATE CASCADE
```

#### Rule DB-6: Slug for URLs
```typescript
// تمام entity های public-facing:
slug (UNIQUE VARCHAR)
// مثال: 'bumper-car-track-standard'
// استفاده برای: /products/bumper-car-track-standard
```

---

## 🔧 NEST.JS BACKEND

### File Structure

```
backend/
├─ src/
│  ├─ config/
│  │  ├─ database.config.ts
│  │  ├─ environment.ts
│  │  └─ swagger.config.ts
│  ├─ modules/
│  │  ├─ auth/
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ auth.service.ts
│  │  │  ├─ auth.module.ts
│  │  │  └─ jwt.strategy.ts
│  │  ├─ users/
│  │  │  ├─ users.controller.ts
│  │  │  ├─ users.service.ts
│  │  │  ├─ users.module.ts
│  │  │  └─ user.entity.ts
│  │  ├─ products/
│  │  │  ├─ products.controller.ts
│  │  │  ├─ products.service.ts
│  │  │  ├─ products.module.ts
│  │  │  ├─ product.entity.ts
│  │  │  └─ dto/
│  │  │     ├─ create-product.dto.ts
│  │  │     └─ update-product.dto.ts
│  │  ├─ customers/
│  │  │  ├─ customers.controller.ts
│  │  │  ├─ customers.service.ts
│  │  │  ├─ customers.module.ts
│  │  │  └─ customer.entity.ts
│  │  ├─ orders/
│  │  │  ├─ orders.controller.ts
│  │  │  ├─ orders.service.ts
│  │  │  ├─ orders.module.ts
│  │  │  ├─ order.entity.ts
│  │  │  └─ dto/
│  │  │     ├─ create-order.dto.ts
│  │  │     └─ update-order.dto.ts
│  │  ├─ quotations/
│  │  ├─ projects/
│  │  ├─ payments/
│  │  ├─ services/
│  │  └─ spare-parts/
│  ├─ common/
│  │  ├─ decorators/
│  │  ├─ filters/
│  │  ├─ guards/
│  │  ├─ interceptors/
│  │  └─ pipes/
│  ├─ database/
│  │  └─ migrations/
│  ├─ app.module.ts
│  └─ main.ts
├─ test/
└─ package.json
```

### API Endpoints Structure

```
Authentication:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/refresh-token
  POST   /api/auth/logout

Products:
  GET    /api/products
  GET    /api/products/:id
  GET    /api/products/slug/:slug
  POST   /api/products (Admin)
  PATCH  /api/products/:id (Admin)
  DELETE /api/products/:id (Admin)
  GET    /api/products/:id/variants
  GET    /api/products/:id/specifications

Customers:
  GET    /api/customers (Me)
  GET    /api/customers/:id (Admin)
  POST   /api/customers/register
  PATCH  /api/customers/:id
  GET    /api/customers/:id/orders
  GET    /api/customers/:id/quotations

Orders:
  POST   /api/orders (Create new order)
  GET    /api/orders (Customer's orders)
  GET    /api/orders/:id (Order details)
  PATCH  /api/orders/:id (Update order)
  GET    /api/orders/:id/history (Order timeline)
  POST   /api/orders/:id/track (Track order status)

Quotations:
  POST   /api/quotations/request (Request quotation)
  GET    /api/quotations/:id (View quotation)
  PATCH  /api/quotations/:id/accept (Accept quotation)
  PATCH  /api/quotations/:id/reject (Reject quotation)
  GET    /api/quotations/:id/convert-to-order (Convert to order)

Projects:
  GET    /api/projects (List projects)
  GET    /api/projects/:id (Project details)
  POST   /api/projects (Admin - Create project)
  PATCH  /api/projects/:id (Admin - Update project)
  GET    /api/projects/:id/phases (Project phases)

Spare Parts:
  GET    /api/spare-parts
  GET    /api/spare-parts/:id
  GET    /api/spare-parts/compatible/:product-id

Invoices:
  GET    /api/invoices (Customer's invoices)
  GET    /api/invoices/:id
  POST   /api/invoices/:id/pay (Payment)
  GET    /api/invoices/:id/download (Download PDF)
```

### Backend Rules for Agents

#### Rule BE-1: DTO Validation
```typescript
// ALWAYS validate incoming data
import { IsString, IsNumber, IsEmail, Min } from 'class-validator'

export class CreateProductDTO {
  @IsString()
  @MinLength(3)
  name: string

  @IsNumber()
  @Min(0)
  price: number

  @IsEmail()
  contact_email: string
}
```

#### Rule BE-2: Error Handling
```typescript
// استفاده از custom exceptions:
throw new BadRequestException('Invalid input')
throw new UnauthorizedException('Invalid credentials')
throw new ForbiddenException('Access denied')
throw new NotFoundException('Resource not found')
throw new ConflictException('Resource already exists')
```

#### Rule BE-3: Authentication Guard
```typescript
// تمام endpoints حساس باید @UseGuards(JwtAuthGuard) داشته باشند
@Controller('api/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController { ... }
```

#### Rule BE-4: Pagination
```typescript
// پشتیبانی pagination برای تمام list endpoints:
GET /api/products?page=1&limit=20&sort=-created_at

// Response:
{
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    pages: 8
  }
}
```

#### Rule BE-5: API Documentation
```typescript
// ALWAYS document endpoints with Swagger:
@ApiOperation({ summary: 'Get all products' })
@ApiResponse({ status: 200, description: 'List of products' })
@ApiQuery({ name: 'page', type: Number, required: false })
@Get()
async findAll(@Query() paginationDto: PaginationDto) { ... }
```

#### Rule BE-6: Soft Delete Queries
```typescript
// ALWAYS exclude deleted records:
const products = await this.productRepository
  .createQueryBuilder('p')
  .where('p.deleted_at IS NULL')
  .getMany()
```

#### Rule BE-7: Logging
```typescript
// Log important operations:
this.logger.log(`Product created: ${product.id}`, 'ProductsService')
this.logger.error(`Payment failed: ${error.message}`, 'PaymentsService')
```

---

## ⚛️ NEXT.JS FRONTEND

### File Structure

```
frontend/
├─ src/
│  ├─ app/
│  │  ├─ (public)/
│  │  │  ├─ page.tsx (Home)
│  │  │  ├─ products/
│  │  │  │  ├─ page.tsx (Products list)
│  │  │  │  └─ [slug]/
│  │  │  │     └─ page.tsx (Product detail)
│  │  │  ├─ projects/
│  │  │  ├─ about/
│  │  │  └─ contact/
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ register/page.tsx
│  │  │  └─ forgot-password/page.tsx
│  │  ├─ (dashboard)/
│  │  │  ├─ dashboard/page.tsx (محدود به logged-in users)
│  │  │  ├─ orders/page.tsx
│  │  │  ├─ quotations/page.tsx
│  │  │  └─ profile/page.tsx
│  │  ├─ api/
│  │  │  └─ (internal Next.js API routes - optional)
│  │  ├─ layout.tsx (Root layout)
│  │  └─ not-found.tsx
│  ├─ components/
│  │  ├─ common/
│  │  │  ├─ Header.tsx
│  │  │  ├─ Footer.tsx
│  │  │  ├─ Navigation.tsx
│  │  │  └─ Breadcrumb.tsx
│  │  ├─ products/
│  │  │  ├─ ProductCard.tsx
│  │  │  ├─ ProductGallery.tsx
│  │  │  └─ ProductFilters.tsx
│  │  ├─ forms/
│  │  │  ├─ ContactForm.tsx
│  │  │  ├─ LoginForm.tsx
│  │  │  ├─ OrderForm.tsx
│  │  │  └─ QuotationRequestForm.tsx
│  │  ├─ ui/
│  │  │  ├─ Button.tsx
│  │  │  ├─ Card.tsx
│  │  │  ├─ Input.tsx
│  │  │  ├─ Modal.tsx
│  │  │  └─ Pagination.tsx
│  │  └─ theme/
│  │     ├─ ThemeProvider.tsx
│  │     └─ ThemeToggle.tsx
│  ├─ config/
│  │  ├─ theme.config.ts
│  │  ├─ api.config.ts
│  │  └─ seo.config.ts
│  ├─ hooks/
│  │  ├─ useTheme.ts
│  │  ├─ useAuth.ts
│  │  ├─ useFetch.ts
│  │  └─ useLocalStorage.ts
│  ├─ store/
│  │  ├─ theme.store.ts
│  │  ├─ auth.store.ts
│  │  └─ cart.store.ts (آینده)
│  ├─ lib/
│  │  ├─ api-client.ts
│  │  ├─ utils.ts
│  │  └─ validators.ts
│  ├─ types/
│  │  ├─ user.ts
│  │  ├─ product.ts
│  │  ├─ order.ts
│  │  └─ common.ts
│  └─ middleware.ts
├─ public/
│  ├─ images/
│  ├─ icons/
│  └─ og-image.jpg
├─ tailwind.config.ts
├─ next.config.ts
├─ tsconfig.json
└─ package.json
```

### Frontend Rules for Agents

#### Rule FE-1: Use Next.js Metadata API
```typescript
// app/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MIG - ماشین کوبنده و تجهیزات شهربازی',
  description: '...',
  keywords: '...',
  openGraph: { ... }
}

export default function Page() { ... }
```

#### Rule FE-2: Image Optimization
```typescript
import Image from 'next/image'

<Image
  src="/product.jpg"
  alt="محصول"
  width={600}
  height={400}
  quality={85}
  sizes="(max-width: 768px) 100vw, 600px"
/>
```

#### Rule FE-3: Server vs Client Components
```typescript
// Server Component (default):
export default async function Page() {
  const data = await fetch('...')
  return <div>{data}</div>
}

// Client Component (when needed):
'use client'
import { useState } from 'react'
export default function Component() { ... }
```

#### Rule FE-4: RTL Support (فارسی)
```html
<!-- app/layout.tsx -->
<html lang="fa" dir="rtl">
  <body>{children}</body>
</html>
```

#### Rule FE-5: Type Safety
```typescript
// ALWAYS use TypeScript types
import { Product, Order } from '@/types'

function ProductCard({ product }: { product: Product }) {
  return <div>{product.name}</div>
}
```

#### Rule FE-6: API Client Pattern
```typescript
// lib/api-client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
})

// Interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

#### Rule FE-7: Error Boundaries
```typescript
'use client'
import { ReactNode } from 'react'

export function ErrorBoundary({ children }: { children: ReactNode }) {
  // Error handling logic
}
```

#### Rule FE-8: Loading States
```typescript
// ALWAYS show loading state during async operations
const [isLoading, setIsLoading] = useState(false)

async function handleSubmit() {
  setIsLoading(true)
  try {
    await submitOrder()
  } finally {
    setIsLoading(false)
  }
}
```

---

## 📝 CODING STANDARDS

### TypeScript

#### Rule TS-1: Type Strictness
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### Rule TS-2: Interface over Type (when possible)
```typescript
// ✅ PREFER
interface Product {
  id: string
  name: string
}

// ❌ AVOID
type Product = {
  id: string
  name: string
}
```

#### Rule TS-3: Enums for Constants
```typescript
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}
```

### Code Style

#### Rule CS-1: Naming Conventions
```typescript
// Classes: PascalCase
class UserService { }

// Functions/Variables: camelCase
const getUserById = () => { }
let isLoading = false

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3
const API_TIMEOUT = 5000

// Interfaces: PascalCase (with I prefix - optional)
interface IProduct { }
or
interface Product { }
```

#### Rule CS-2: File Naming
```
// Components: PascalCase
src/components/ProductCard.tsx
src/components/OrderForm.tsx

// Utilities: camelCase
src/lib/apiClient.ts
src/utils/validators.ts

// Pages: kebab-case (Next.js)
src/app/products/page.tsx
src/app/auth/login/page.tsx
```

#### Rule CS-3: Comments & Documentation
```typescript
// 1. JSDoc برای public functions
/**
 * محاسبه کل سفارش شامل مالیات
 * @param items - آیتم‌های سفارش
 * @param taxRate - نرخ مالیات (0.09 = 9%)
 * @returns کل سفارش
 */
function calculateOrderTotal(items: OrderItem[], taxRate: number): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0) * (1 + taxRate)
}

// 2. TODO برای کارهای آینده
// TODO: اضافه کردن validation برای شماره کارت

// 3. FIXME برای bugs شناخته شده
// FIXME: این performance issue را حل کن
```

#### Rule CS-4: Import Organization
```typescript
// 1. External libraries
import { Controller, Get } from '@nestjs/common'
import axios from 'axios'

// 2. Local imports (absolute path with @)
import { UserService } from '@/modules/users/users.service'
import { Product } from '@/types'

// 3. Styles/Config
import styles from './Component.module.css'
```

### Formatting

#### Rule FMT-1: Prettier Config
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always"
}
```

#### Rule FMT-2: ESLint Rules
```json
// .eslintrc.json
{
  "rules": {
    "no-console": "warn",
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

---

## 🤖 AI AGENT RULES

### General Implementation Rules

#### Rule AG-1: Follow Project Context ALWAYS
```
❌ NEVER ignore Business Context
✅ ALWAYS validate against Business-Description.md
✅ ALWAYS maintain MIG + Funtino brand distinction
✅ ALWAYS remember 3 business pillars: Manufacturing + Operations + Investment
```

#### Rule AG-2: Theme System Non-Negotiable
```
❌ NEVER hardcode colors, fonts, spacing
❌ NEVER create separate style files per component
✅ ALWAYS use theme.config.ts as single source of truth
✅ ALWAYS use Tailwind classes with theme values
✅ ALWAYS use useTheme() hook in React components
```

#### Rule AG-3: Database Schema Flexibility
```
❌ NEVER use rigid fixed tables
❌ NEVER create separate columns for each variation
✅ ALWAYS use JSON fields for variations
✅ ALWAYS support customization (colors, sizes, specs)
✅ ALWAYS include soft deletes and audit timestamps
✅ ALWAYS design for e-commerce B2B operations
```

#### Rule AG-4: Type Safety MANDATORY
```
❌ NEVER use 'any' type
❌ NEVER skip TypeScript validation
✅ ALWAYS define interfaces for all data
✅ ALWAYS use strict mode in tsconfig
✅ ALWAYS validate with DTOs (Nest.js)
✅ ALWAYS validate with Zod (React)
```

#### Rule AG-5: API Documentation Required
```
❌ NEVER create endpoint without Swagger docs
❌ NEVER forget error responses
✅ ALWAYS document with @ApiOperation()
✅ ALWAYS document with @ApiResponse()
✅ ALWAYS include request/response examples
✅ ALWAYS document query/path parameters
```

#### Rule AG-6: Error Handling Complete
```
❌ NEVER swallow errors silently
❌ NEVER return vague error messages
✅ ALWAYS provide meaningful error messages
✅ ALWAYS include error codes
✅ ALWAYS log errors for debugging
✅ ALWAYS return proper HTTP status codes
```

#### Rule AG-7: Testing & Validation
```
❌ NEVER deploy without tests
❌ NEVER skip input validation
✅ ALWAYS validate incoming data (DTOs)
✅ ALWAYS write unit tests
✅ ALWAYS test edge cases
✅ ALWAYS validate at backend (NEVER trust frontend)
```

#### Rule AG-8: SEO Implementation
```
❌ NEVER forget SEO
✅ ALWAYS use metadata API (Next.js)
✅ ALWAYS create sitemap.xml
✅ ALWAYS create robots.txt
✅ ALWAYS add structured data (JSON-LD)
✅ ALWAYS optimize images
✅ ALWAYS use dynamic metadata for pages
```

#### Rule AG-9: Security Standards
```
❌ NEVER store passwords in plain text
❌ NEVER expose sensitive data in API
✅ ALWAYS hash passwords (bcrypt)
✅ ALWAYS use JWT for authentication
✅ ALWAYS validate CORS
✅ ALWAYS use HTTPS in production
✅ ALWAYS sanitize inputs
✅ ALWAYS implement rate limiting
```

#### Rule AG-10: Performance Optimization
```
❌ NEVER ignore performance
❌ NEVER fetch all records without pagination
✅ ALWAYS implement pagination
✅ ALWAYS use database indexes
✅ ALWAYS optimize images
✅ ALWAYS minimize bundle size
✅ ALWAYS cache when appropriate
```

### Task-Specific Rules

#### When Creating Tables/Entities

```
✅ MUST include:
  - id (UUID, PRIMARY KEY)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
  - deleted_at (TIMESTAMP, nullable - soft delete)
  
✅ MUST for B2B operations:
  - customer_id (FK) if customer-related
  - status (ENUM) if workflow-based
  - currency (VARCHAR) if pricing
  
✅ MUST for flexibility:
  - JSON fields for custom data
  - versioning if historical tracking needed
  
❌ NEVER:
  - Use auto-increment INT for distributed systems (use UUID)
  - Skip relationships/foreign keys
  - Create without indexes on frequently queried fields
```

#### When Creating API Endpoints

```
✅ MUST include:
  - Swagger documentation
  - Input validation (DTO)
  - Error handling
  - Authentication guard (if needed)
  - Pagination (for list endpoints)
  
✅ MUST return:
  - Consistent JSON structure
  - Error responses with status codes
  - Timestamps in ISO 8601 format
  
❌ NEVER:
  - Expose database column names directly
  - Return sensitive data (passwords, tokens)
  - Skip error handling
```

#### When Creating React Components

```
✅ MUST include:
  - TypeScript types
  - PropTypes or interface
  - Accessibility (alt text, ARIA labels)
  - Theme usage (useTheme() hook)
  
✅ MUST for user-facing:
  - Loading states
  - Error handling
  - Responsive design
  - Keyboard navigation
  
❌ NEVER:
  - Hardcode styles
  - Use inline styles except for dynamic values
  - Skip error boundaries
```

#### When Implementing E-commerce Features

```
✅ MUST support:
  - Custom quotations (not just cart checkout)
  - Multiple payment terms (Net 30, Net 60, prepaid)
  - Order customization (colors, specs, etc.)
  - Project-based orders (phased delivery)
  
✅ MUST handle:
  - Different currencies
  - Tax calculations
  - Shipping costs
  - Inventory management
  
❌ NEVER:
  - Assume simple shopping cart model
  - Ignore B2B workflows
```

---

## 📊 Implementation Checklist for Agents

Before implementing ANY feature, verify:

```
□ Business Context - Is this aligned with MIG's 3-pillar model?
□ Theme Usage - Are colors/fonts from theme.config.ts?
□ Database Design - Is schema flexible and audit-ready?
□ Type Safety - Are all TypeScript types defined?
□ API Docs - Is Swagger documentation complete?
□ Error Handling - Are all error cases handled?
□ Validation - Are inputs validated at backend?
□ Testing - Are edge cases tested?
□ SEO (Frontend) - Is metadata properly set?
□ Security - Are auth guards and sanitization in place?
□ Performance - Are indexes and pagination used?
```

---

## 🚀 Quick Reference

### Technology Versions
- Node.js: >= 18.0.0
- Next.js: 14+
- Nest.js: 10+
- TypeScript: 5.3+
- Tailwind CSS: 3.4+
- PostgreSQL: 14+

### Important Links
- 📘 Nest.js Docs: https://docs.nestjs.com
- 📗 Next.js Docs: https://nextjs.org/docs
- 🎨 Tailwind Docs: https://tailwindcss.com/docs
- 📙 TypeORM: https://typeorm.io

### Key Files (Always Update Together)
- `0-DOCS/Business-Description.md` ← Project Context
- `0-DOCS/IMPLEMENTATION_GUIDELINES.md` ← This File
- `frontend/src/config/theme.config.ts` ← Theme Central
- `backend/src/config/database.config.ts` ← DB Config

---

## 📝 Document Version
- **Created:** 2026-09-02
- **Version:** 1.0
- **Status:** Active
- **Last Updated:** 2026-09-02

---

**⚠️ IMPORTANT FOR ALL AGENTS:**

This document is the SINGLE SOURCE OF TRUTH for MIG project implementation.
Before any code changes, **verify these guidelines**.
When guidelines are unclear, **ask for clarification** rather than assuming.

