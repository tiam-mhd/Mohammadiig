# 💾 DATABASE SCHEMA - DETAILED DESIGN

**برای پروژه: MIG E-Commerce + B2B Platform**

---

## 📌 Design Philosophy

```
1. FLEXIBILITY: Support custom orders, variations, specs
2. SCALABILITY: Indexes, efficient queries, audit trails
3. B2B: Multiple payment terms, quotations, projects
4. AUDIT: Every change tracked (created_at, updated_at, deleted_at)
5. INTERNATIONALIZATION: Multi-currency, multi-language ready
6. SECURITY: Soft deletes, data integrity, role-based access
```

---

## 🔑 Naming Conventions

```
Tables:           snake_case (users, order_items, product_specifications)
Columns:          snake_case (user_id, created_at, price_base)
Primary Keys:     id (UUID)
Foreign Keys:     [table_name]_id (user_id, customer_id, product_id)
Soft Delete:      deleted_at (TIMESTAMP NULL)
Status Enum:      status (varchar or enum type)
Boolean:          is_[adjective] (is_active, is_customizable)
Timestamps:       created_at, updated_at, deleted_at
```

---

## 📊 Complete Table Schemas

### 1️⃣ **users** - کاربران سیستم

```sql
CREATE TABLE users (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  
  -- Role & Status
  role VARCHAR(50) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('admin', 'salesman', 'customer', 'support', 'accountant')),
  is_active BOOLEAN DEFAULT true,
  
  -- Company (for B2B users)
  company_name VARCHAR(255),
  
  -- Tracking
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_email (email),
  INDEX idx_created_at (created_at),
  INDEX idx_is_active (is_active)
);
```

---

### 2️⃣ **customers** - مشتریان B2B

```sql
CREATE TABLE customers (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  company_registration_number VARCHAR(50),
  company_website VARCHAR(255),
  industry VARCHAR(100),
  
  -- Address
  country VARCHAR(50),
  state_province VARCHAR(100),
  city VARCHAR(100),
  address VARCHAR(500),
  postal_code VARCHAR(20),
  
  -- Contact
  phone VARCHAR(20),
  contact_person VARCHAR(100),
  
  -- Business Terms
  payment_terms VARCHAR(50) DEFAULT 'net_30'
    CHECK (payment_terms IN ('prepay', 'net_30', 'net_60', 'net_90', 'custom')),
  credit_limit DECIMAL(18,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Tax & Legal
  tax_id VARCHAR(50),
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP NULL,
  
  -- Tracking
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_company_name (company_name),
  INDEX idx_country (country),
  INDEX idx_is_verified (is_verified)
);
```

---

### 3️⃣ **product_categories** - دسته‌بندی محصولات

```sql
CREATE TABLE product_categories (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en VARCHAR(100) NOT NULL,
  name_fa VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  
  -- Hierarchy
  parent_category_id UUID NULL REFERENCES product_categories(id) ON DELETE SET NULL,
  
  -- Display
  description_en TEXT,
  description_fa TEXT,
  icon_url VARCHAR(500),
  display_order INT DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_slug (slug),
  INDEX idx_parent_category_id (parent_category_id),
  INDEX idx_is_active (is_active),
  INDEX idx_display_order (display_order)
);
```

---

### 4️⃣ **products** - محصولات اصلی

```sql
CREATE TABLE products (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  manufacturer_code VARCHAR(50),
  
  -- Product Details
  name_en VARCHAR(200) NOT NULL,
  name_fa VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
  
  -- Description
  description_short_en VARCHAR(500),
  description_short_fa VARCHAR(500),
  description_long_en TEXT,
  description_long_fa TEXT,
  
  -- Specifications (JSON for flexibility)
  specifications JSON NOT NULL DEFAULT '{}'
    COMMENT 'Flexible schema: {power, dimensions, weight, material, etc.}',
  
  -- Pricing
  price_base DECIMAL(18,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Media
  thumbnail_image_url VARCHAR(500),
  images JSON DEFAULT '[]' COMMENT 'Array of image URLs',
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_customizable BOOLEAN DEFAULT false,
  warranty_months INT DEFAULT 12,
  lead_time_days INT DEFAULT 30,
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_sku (sku),
  INDEX idx_slug (slug),
  INDEX idx_category_id (category_id),
  INDEX idx_is_active (is_active),
  INDEX idx_is_customizable (is_customizable)
);
```

---

### 5️⃣ **product_variants** - نسخه‌های محصول

```sql
CREATE TABLE product_variants (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku_variant VARCHAR(50) UNIQUE NOT NULL,
  
  -- Variant Details
  variant_name_en VARCHAR(100) NOT NULL,
  variant_name_fa VARCHAR(100) NOT NULL,
  variant_code VARCHAR(50),
  
  -- Specifications (override parent product specs)
  specifications JSON NOT NULL DEFAULT '{}',
  
  -- Pricing
  price_base DECIMAL(18,2),
  price_adjustment DECIMAL(18,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Inventory
  stock_quantity INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  
  -- Media
  images JSON DEFAULT '[]',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_product_id (product_id),
  INDEX idx_sku_variant (sku_variant),
  INDEX idx_is_active (is_active)
);
```

---

### 6️⃣ **product_specifications** - مشخصات فنی جزئی

```sql
CREATE TABLE product_specifications (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Specification Details
  specification_key VARCHAR(100) NOT NULL
    COMMENT 'power_hp, max_speed_kmh, weight_kg, dimensions, etc.',
  specification_value VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  
  -- Organization
  spec_category VARCHAR(50) NOT NULL
    COMMENT 'Engine, Dimensions, Safety, Materials, Electronics, etc.',
  display_order INT DEFAULT 0,
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(product_id, specification_key),
  
  -- Indexes
  INDEX idx_product_id (product_id),
  INDEX idx_spec_category (spec_category),
  INDEX idx_specification_key (specification_key)
);
```

---

### 7️⃣ **spare_parts** - قطعات یدکی

```sql
CREATE TABLE spare_parts (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Details
  name_en VARCHAR(150) NOT NULL,
  name_fa VARCHAR(150) NOT NULL,
  description TEXT,
  
  -- Compatibility (JSON array of product IDs)
  compatible_products JSON DEFAULT '[]',
  
  -- Pricing
  price DECIMAL(18,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Inventory
  stock_quantity INT DEFAULT 0,
  reorder_level INT DEFAULT 5,
  
  -- Supplier
  supplier_id VARCHAR(100),
  supplier_code VARCHAR(100),
  
  -- Additional Info
  image_url VARCHAR(500),
  warranty_months INT DEFAULT 12,
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_part_number (part_number),
  INDEX idx_is_active (is_active),
  INDEX idx_stock_quantity (stock_quantity)
);
```

---

### 8️⃣ **orders** - سفارشات

```sql
CREATE TABLE orders (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  
  -- Dates
  order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  required_delivery_date TIMESTAMP NULL,
  actual_delivery_date TIMESTAMP NULL,
  
  -- Status & Type
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'manufactured', 'shipped', 'delivered', 'cancelled')),
  order_type VARCHAR(50) NOT NULL DEFAULT 'standard'
    CHECK (order_type IN ('standard', 'custom', 'project', 'replacement')),
  
  -- Addresses (JSON for flexibility)
  shipping_address JSON NOT NULL,
  billing_address JSON NOT NULL,
  
  -- Financial
  subtotal DECIMAL(18,2) NOT NULL,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  shipping_cost DECIMAL(18,2) DEFAULT 0,
  discount_amount DECIMAL(18,2) DEFAULT 0,
  total_amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue', 'refunded')),
  payment_terms VARCHAR(50),
  payment_due_date TIMESTAMP NULL,
  
  -- Additional
  notes TEXT,
  internal_notes TEXT,
  reference_quotation_id UUID NULL,
  
  -- Tracking
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_order_number (order_number),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_order_date (order_date),
  INDEX idx_required_delivery_date (required_delivery_date)
);
```

---

### 9️⃣ **order_items** - آیتم‌های سفارش

```sql
CREATE TABLE order_items (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  
  -- Quantity & Pricing
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(18,2) NOT NULL,
  line_total DECIMAL(18,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Customizations (JSON for flexibility)
  customizations_json JSON DEFAULT '{}',
  
  -- Delivery
  delivery_phase INT DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'shipped', 'delivered', 'cancelled')),
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
);
```

---

### 🔟 **order_customizations** - تخصیص‌های سفارش

```sql
CREATE TABLE order_customizations (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  
  -- Customization Details
  customization_type VARCHAR(50) NOT NULL
    CHECK (customization_type IN ('color', 'size', 'design', 'material', 'specification', 'other')),
  customization_name_en VARCHAR(100),
  customization_name_fa VARCHAR(100),
  customization_value VARCHAR(255) NOT NULL,
  
  -- Description & Cost
  customization_description TEXT,
  additional_cost DECIMAL(18,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Approval
  is_approved BOOLEAN DEFAULT false,
  approval_date TIMESTAMP NULL,
  approved_by UUID NULL REFERENCES users(id),
  
  -- Notes
  notes TEXT,
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_order_item_id (order_item_id),
  INDEX idx_customization_type (customization_type),
  INDEX idx_is_approved (is_approved)
);
```

---

### 1️⃣1️⃣ **quotations** - نقل‌قول‌های کاستم

```sql
CREATE TABLE quotations (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  
  -- Details
  quoted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  issue_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NOT NULL,
  
  -- Items (JSON for flexibility)
  items JSON NOT NULL DEFAULT '[]'
    COMMENT '[{product_id, quantity, price, customization_specs}, ...]',
  
  -- Financial
  subtotal DECIMAL(18,2) NOT NULL,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(18,2) DEFAULT 0,
  total_amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  
  -- Terms & Conditions
  terms_and_conditions TEXT,
  notes TEXT,
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_quotation_number (quotation_number),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_valid_until (valid_until)
);
```

---

### 1️⃣2️⃣ **projects** - پروژه‌های سرمایه‌گذاری/شراکت

```sql
CREATE TABLE projects (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Details
  project_name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Relationship
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Project Type & Location
  project_type VARCHAR(50) NOT NULL
    CHECK (project_type IN ('partnership', 'investment', 'equipment_supply', 'installation', 'other')),
  country VARCHAR(50),
  city VARCHAR(100),
  location_details TEXT,
  
  -- Timeline
  start_date DATE NOT NULL,
  expected_completion_date DATE NOT NULL,
  actual_completion_date DATE NULL,
  
  -- Financial
  budget_total DECIMAL(18,2) NOT NULL,
  budget_spent DECIMAL(18,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Investment Terms
  mig_investment_percentage DECIMAL(5,2) DEFAULT 0
    COMMENT 'MIG ownership percentage',
  profit_sharing_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  
  -- Documents (JSON array)
  documents JSON DEFAULT '[]'
    COMMENT '[{name, type, url, uploaded_at}, ...]',
  
  -- Tracking
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_project_code (project_code),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_start_date (start_date),
  INDEX idx_expected_completion_date (expected_completion_date)
);
```

---

### 1️⃣3️⃣ **project_phases** - مراحل پروژه

```sql
CREATE TABLE project_phases (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Phase Details
  phase_number INT NOT NULL,
  phase_name_en VARCHAR(100) NOT NULL,
  phase_name_fa VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  
  -- Deliverables (JSON)
  deliverables JSON DEFAULT '[]'
    COMMENT '[{name, description, status}, ...]',
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(project_id, phase_number),
  
  -- Indexes
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_start_date (start_date)
);
```

---

### 1️⃣4️⃣ **services** - خدمات اضافی

```sql
CREATE TABLE services (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Details
  name_en VARCHAR(150) NOT NULL,
  name_fa VARCHAR(150) NOT NULL,
  description TEXT,
  
  -- Classification
  service_category VARCHAR(50) NOT NULL
    CHECK (service_category IN ('installation', 'training', 'maintenance', 'support', 'customization', 'other')),
  
  -- Pricing
  base_price DECIMAL(18,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  unit_type VARCHAR(50) NOT NULL DEFAULT 'fixed'
    CHECK (unit_type IN ('per_hour', 'per_day', 'per_visit', 'per_unit', 'fixed')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_service_category (service_category),
  INDEX idx_is_active (is_active)
);
```

---

### 1️⃣5️⃣ **invoices** - فاکتورها

```sql
CREATE TABLE invoices (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relationships
  order_id UUID NULL REFERENCES orders(id) ON DELETE SET NULL,
  quotation_id UUID NULL REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  
  -- Dates
  invoice_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NOT NULL,
  
  -- Financial
  total_before_tax DECIMAL(18,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  total_after_tax DECIMAL(18,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  
  -- Details
  notes TEXT,
  attachments JSON DEFAULT '[]',
  
  -- Tracking
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_customer_id (customer_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_due_date (due_date),
  INDEX idx_order_id (order_id)
);
```

---

### 1️⃣6️⃣ **payments** - ثبت پرداخت‌ها

```sql
CREATE TABLE payments (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  order_id UUID NULL REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Payment Details
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment Method
  payment_method VARCHAR(50) NOT NULL
    CHECK (payment_method IN ('bank_transfer', 'credit_card', 'check', 'cash', 'cryptocurrency', 'other')),
  transaction_id VARCHAR(100),
  
  -- Status
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Additional
  notes TEXT,
  receipt_url VARCHAR(500),
  
  -- Tracking
  processed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_payment_date (payment_date),
  INDEX idx_transaction_id (transaction_id)
);
```

---

### 1️⃣7️⃣ **attachments** - فایل‌های ضمیمه

```sql
CREATE TABLE attachments (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner (polymorphic relationship)
  owner_type VARCHAR(50) NOT NULL
    CHECK (owner_type IN ('Order', 'Quotation', 'Project', 'Invoice', 'ProjectPhase')),
  owner_id UUID NOT NULL,
  
  -- File Details
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INT,
  file_type VARCHAR(50)
    COMMENT 'pdf, image, document, spreadsheet, etc.',
  
  -- Upload Info
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Tracking
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_owner (owner_type, owner_id),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_uploaded_at (uploaded_at)
);
```

---

## 🔍 Comprehensive Indexing Strategy

```sql
-- Authentication & Access (HIGH PRIORITY)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Customers (HIGH PRIORITY)
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_country ON customers(country);

-- Products (HIGH PRIORITY)
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Orders (CRITICAL)
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_required_delivery_date ON orders(required_delivery_date);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_status ON order_items(status);

-- Quotations (HIGH PRIORITY)
CREATE INDEX idx_quotations_quotation_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_valid_until ON quotations(valid_until);

-- Projects
CREATE INDEX idx_projects_project_code ON projects(project_code);
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Invoices & Payments
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);
```

---

## 🔐 Foreign Key Constraints

```sql
-- Enforce data integrity
ALTER TABLE users ADD CONSTRAINT fk_users_pk PRIMARY KEY (id);

ALTER TABLE customers 
  ADD CONSTRAINT fk_customers_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE products 
  ADD CONSTRAINT fk_products_category_id 
  FOREIGN KEY (category_id) REFERENCES product_categories(id) 
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE orders 
  ADD CONSTRAINT fk_orders_customer_id 
  FOREIGN KEY (customer_id) REFERENCES customers(id) 
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE orders 
  ADD CONSTRAINT fk_orders_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE order_items 
  ADD CONSTRAINT fk_order_items_order_id 
  FOREIGN KEY (order_id) REFERENCES orders(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE quotations 
  ADD CONSTRAINT fk_quotations_customer_id 
  FOREIGN KEY (customer_id) REFERENCES customers(id) 
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE invoices 
  ADD CONSTRAINT fk_invoices_customer_id 
  FOREIGN KEY (customer_id) REFERENCES customers(id) 
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE payments 
  ADD CONSTRAINT fk_payments_invoice_id 
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 📐 Migration Strategy

```typescript
// Migration Example for TypeORM
import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class CreateUsersTable1693497600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "users",
      columns: [
        {
          name: "id",
          type: "uuid",
          isPrimary: true,
          default: "gen_random_uuid()"
        },
        {
          name: "email",
          type: "varchar",
          isUnique: true
        },
        // ... more columns
      ]
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("users")
  }
}
```

---

## 🧪 Query Examples

### List Orders with Pagination
```sql
SELECT o.*, c.company_name, COUNT(*) OVER() as total_count
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.deleted_at IS NULL
  AND o.customer_id = 'customer-uuid'
ORDER BY o.created_at DESC
LIMIT 20 OFFSET 0;
```

### Get Product with Specifications
```sql
SELECT 
  p.*,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'key', ps.specification_key,
      'value', ps.specification_value,
      'unit', ps.unit
    )
  ) as specifications
FROM products p
LEFT JOIN product_specifications ps ON p.id = ps.product_id
WHERE p.slug = 'bumper-car-track-standard'
  AND p.deleted_at IS NULL
GROUP BY p.id;
```

### Order Revenue Report
```sql
SELECT 
  o.status,
  COUNT(*) as order_count,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as avg_order_value
FROM orders o
WHERE o.deleted_at IS NULL
  AND o.created_at >= NOW() - INTERVAL '1 month'
GROUP BY o.status
ORDER BY total_revenue DESC;
```

---

## 💡 Design Decisions Explained

### 1. UUID for Primary Keys
- ✅ Globally unique
- ✅ Distributed-friendly
- ✅ Privacy (can't guess IDs sequentially)
- ❌ Slightly larger storage

### 2. JSON Fields for Specifications
- ✅ Extreme flexibility
- ✅ No schema changes for new specs
- ✅ Supports nested structures
- ⚠️ Not indexed by default (add functional indexes if needed)

### 3. Soft Deletes
- ✅ Never lose data
- ✅ Audit trail preserved
- ✅ Restore capability
- ⚠️ Must always check `deleted_at IS NULL`

### 4. Separate customer Table
- ✅ B2B-specific fields (payment_terms, credit_limit)
- ✅ Many-to-one relationship with users
- ✅ Support for multiple users per company

### 5. Polymorphic Attachments
- ✅ Flexible for multiple entity types
- ❌ No foreign key constraint
- ⚠️ Need app-level validation

---

## 📝 Final Notes

- Always query with `deleted_at IS NULL` for soft deletes
- Keep `created_at`, `updated_at`, `deleted_at` in every table
- Use JSON for flexible data, but add indexes if frequently queried
- Test migrations in development before production
- Plan backup strategy for PostgreSQL database

