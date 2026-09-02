# 🤖 AI AGENT MASTER INSTRUCTIONS
## برای تمام AI Assistants و Agents - کلیه مدل‌ها و هوش‌های مصنوعی

---

## ⚡ CRITICAL: Read First

```
این فایل MANDATORY است برای هر AI Agent/Assistant که روی پروژه MIG کار می‌کند.
Before any task, read this file COMPLETELY.
When in doubt, refer back to this file.
```

---

## 📦 PROJECT CONTEXT AT A GLANCE

### What is MIG?
```
MIG = Mohammadi Industrial Group

Business Model:
  Manufacturing    → تولید ماشین کوبنده، پیست، قطعات یدکی
  Operations       → Funtino Brand (بهره‌برداری شهربازی)
  Investment       → شراکت و سرمایه‌گذاری در پروژه‌های شهربازی
```

### Key Numbers
- 👥 Team: 15+ professional members
- 🏭 Specialty: Bumper cars & amusement equipment
- 📍 Real Projects: Frozen Park, Arjomandi VR Park
- 🌍 International: ATRAX Exhibition (Turkey 2024)

### Brand Clarity
```
❌ WRONG: MIG = فانتینو
✅ CORRECT:
   MIG = صنعتی/تولید (Mohammadi Industrial Group)
   Funtino = عملیاتی/بهره‌برداری (Amusement Parks)
```

---

## 🚫 ABSOLUTE PROHIBITIONS

### For ALL Agents (No Exceptions)

```
❌ DO NOT hardcode colors/sizes/fonts
❌ DO NOT ignore theme.config.ts
❌ DO NOT use type 'any' in TypeScript
❌ DO NOT skip validation (backend AND frontend)
❌ DO NOT skip error handling
❌ DO NOT forget SEO on frontend pages
❌ DO NOT create APIs without Swagger docs
❌ DO NOT ignore soft deletes in database
❌ DO NOT forget business context
❌ DO NOT assume simple shopping cart model
```

### Specific to Backend (Nest.js)

```
❌ DO NOT query with deleted records
❌ DO NOT hardcode database values
❌ DO NOT expose sensitive data in API
❌ DO NOT create endpoints without auth guards (when needed)
❌ DO NOT return unhelpful error messages
❌ DO NOT skip input validation with DTOs
```

### Specific to Frontend (Next.js)

```
❌ DO NOT mix Tailwind and inline styles
❌ DO NOT skip metadata on pages
❌ DO NOT use any Client Component when Server works
❌ DO NOT skip image optimization
❌ DO NOT hardcode API URLs (use env variables)
❌ DO NOT ignore RTL (فارسی) support
```

### Specific to Database

```
❌ DO NOT create rigid table structures
❌ DO NOT forget audit fields (created_at, updated_at, deleted_at)
❌ DO NOT skip foreign keys
❌ DO NOT forget indexes on query columns
❌ DO NOT use AUTO_INCREMENT for distributed systems (use UUID)
```

---

## ✅ MANDATORY BEST PRACTICES

### For ALL Code

```
✅ Type Safety
  - Use TypeScript strict mode
  - Define interfaces for everything
  - No 'any' types
  - Validate all inputs

✅ Error Handling
  - Meaningful error messages
  - Proper HTTP status codes
  - Logging for debugging
  - User-friendly error display (frontend)

✅ Security
  - Hash passwords with bcrypt
  - Use JWT for auth
  - Sanitize inputs
  - Validate at backend (NEVER trust frontend)
  - Use HTTPS in production

✅ Documentation
  - JSDoc for functions
  - Swagger for APIs
  - Comments for complex logic
  - README for setup

✅ Testing
  - Unit tests for business logic
  - Integration tests for APIs
  - Test edge cases
  - Keep tests maintainable

✅ Performance
  - Implement pagination (don't fetch all)
  - Use database indexes
  - Optimize images
  - Cache when appropriate
  - Minimize bundle size (frontend)

✅ Code Quality
  - Follow naming conventions
  - Keep functions small and focused
  - DRY principle (Don't Repeat Yourself)
  - Use constants for magic values
  - Proper git commits
```

---

## 🏗️ ARCHITECTURE REQUIREMENTS

### Frontend (Next.js)
```
Required Structure:
  ✅ src/app/          → Pages (App Router)
  ✅ src/components/   → React Components
  ✅ src/config/       → Configuration (including theme.config.ts)
  ✅ src/hooks/        → Custom hooks (including useTheme.ts)
  ✅ src/store/        → Zustand state (including theme.store.ts)
  ✅ src/lib/          → Utilities & API client
  ✅ src/types/        → TypeScript interfaces
  ✅ public/           → Static assets

Configuration Files:
  ✅ tailwind.config.ts
  ✅ tsconfig.json (with strict mode)
  ✅ .env.local (for local vars)
  ✅ next.config.js (production config)
```

### Backend (Nest.js)
```
Required Structure:
  ✅ src/config/       → Database, environment config
  ✅ src/modules/      → Feature modules (users, products, orders)
  ✅ src/common/       → Shared (decorators, guards, pipes)
  ✅ src/database/     → Migrations & entities
  ✅ src/main.ts       → Entry point
  ✅ test/             → Test files

Configuration Files:
  ✅ tsconfig.json (with strict mode)
  ✅ .env (environment variables)
  ✅ ormconfig.json or datasource.ts (TypeORM)
```

---

## 🎨 THEME SYSTEM - NON-NEGOTIABLE

### The Rule
```
ALL styling must come from theme.config.ts
This is the ONLY place where colors/fonts/sizes are defined.
```

### How It Works

```
1. Define in theme.config.ts:
   themeConfig = {
     colors: { primary: { 500: '#5470ff' }, ... },
     typography: { fontSize: { base: '1rem' }, ... },
     spacing: { 4: '1rem', ... }
   }

2. Use in Tailwind:
   class="text-primary-500 px-4 py-2"

3. Use in React Components:
   const { colors } = useTheme()
   <div style={{ color: colors.primary[500] }} />

4. Store State:
   useThemeStore() → manage isDarkMode, color updates

5. Admin Panel (Future):
   Read from database → Update useThemeStore → All UI updates
```

### Example: Correct vs Wrong

❌ **WRONG:**
```typescript
<Button style={{ backgroundColor: '#5470ff' }} />
<div className="text-blue-500" />
<Card style={{ padding: '20px' }} />
```

✅ **CORRECT:**
```typescript
const theme = useTheme()
<Button style={{ backgroundColor: theme.colors.primary[500] }} />
<div className="text-primary-500" />
<Card className="p-4" /> {/* p-4 = theme spacing[4] */}
```

---

## 💾 DATABASE - COMPLETE FLEXIBILITY

### Core Principle
```
Flexibility for Custom Orders + E-Commerce + B2B + Projects
```

### Essential Tables
```
1. users                    → Authentication
2. customers                → B2B customers
3. products                 → Main product catalog
4. product_variants         → Different models/versions
5. product_specifications   → Detailed tech specs
6. orders                   → Customer orders
7. order_items              → Items in order
8. order_customizations     → Custom specs (color, size, etc.)
9. quotations               → Custom price quotes
10. projects                → Investment/Partnership projects
11. spare_parts             → Replacement parts
12. services                → Installation, training, support
13. invoices                → Billing
14. payments                → Payment tracking
15. attachments             → Files & documents
```

### Design Patterns

#### Pattern 1: Support Custom Specifications
```sql
❌ Wrong (rigid):
  product_bumper_cars (
    color_red BOOLEAN,
    color_blue BOOLEAN,
    color_green BOOLEAN,
    size_small BOOLEAN,
    size_medium BOOLEAN
  )

✅ Correct (flexible):
  order_customizations (
    customization_type VARCHAR (color, size, material, etc.)
    customization_value VARCHAR
    additional_cost DECIMAL
  )
```

#### Pattern 2: Support Multiple Currencies
```sql
❌ Wrong (one currency):
  products (price INT)

✅ Correct (flexible):
  products (
    price DECIMAL(18,2),
    currency VARCHAR(3) -- USD, EUR, IRR
  )
```

#### Pattern 3: Audit Trail
```sql
✅ Every table must have:
  created_at TIMESTAMP NOT NULL
  updated_at TIMESTAMP NOT NULL
  deleted_at TIMESTAMP NULL -- soft delete, never hard delete
```

#### Pattern 4: JSON for Complex Data
```sql
✅ When variations are unlimited:
  order_items (
    customizations_json JSON,
    -- Instead of separate columns for each possibility
  )

✅ Complex addresses:
  orders (
    shipping_address_json JSON,
    billing_address_json JSON
  )
```

### Indexing Strategy
```sql
-- Always index:
✅ Foreign keys
✅ Status columns (for filtering)
✅ Date columns (for sorting)
✅ Search fields (name, code, email)

❌ Never index:
❌ Large text columns (unless full-text search)
❌ JSON fields (unless stored generated)
```

---

## 🔌 API GUIDELINES

### Endpoint Structure
```
Pattern:  /api/v1/[resource]/[action]

Examples:
  POST   /api/v1/orders              → Create order
  GET    /api/v1/orders              → List orders (with pagination)
  GET    /api/v1/orders/123          → Get order detail
  PATCH  /api/v1/orders/123          → Update order
  DELETE /api/v1/orders/123          → Delete order (soft delete)
  POST   /api/v1/orders/123/track    → Track order status
  POST   /api/v1/quotations          → Request quotation
  GET    /api/v1/quotations/123      → Get quotation
  PATCH  /api/v1/quotations/123/accept → Accept quotation
```

### Response Format
```json
// Success (List with Pagination)
{
  "success": true,
  "data": [
    { "id": "123", "name": "Product A", ... },
    { "id": "124", "name": "Product B", ... }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "timestamp": "2026-09-02T12:00:00Z"
}

// Success (Single Item)
{
  "success": true,
  "data": { "id": "123", "name": "Product A", ... },
  "timestamp": "2026-09-02T12:00:00Z"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input: price must be > 0",
    "details": [
      { "field": "price", "message": "must be greater than 0" }
    ]
  },
  "timestamp": "2026-09-02T12:00:00Z"
}
```

### Required for Every Endpoint
```typescript
✅ Swagger documentation (@ApiOperation, @ApiResponse)
✅ Input validation (DTO with decorators)
✅ Error handling (with proper HTTP status codes)
✅ Authentication guard (if needed)
✅ Logging for important operations
✅ Pagination (for list endpoints)
```

---

## 🌐 FRONTEND PAGES - SEO CRITICAL

### Every Page Must Have
```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Detailed description',
  keywords: 'keyword1, keyword2',
  openGraph: {
    title: '...',
    description: '...',
    images: [{ url: '...', width: 1200, height: 630 }]
  }
}

export default function Page() { ... }
```

### Additional SEO Requirements
```
✅ sitemap.xml  - Auto-generated
✅ robots.txt   - Configured
✅ JSON-LD      - Structured data for products/organization
✅ Image Alt    - All images must have meaningful alt text
✅ Canonical    - Set for duplicate-prone pages
✅ Headers      - H1, H2 hierarchy proper
```

---

## 🔐 SECURITY CHECKLIST

### Authentication
```
✅ Passwords: bcrypt with salt rounds 10+
✅ Tokens: JWT with expiration (15-60 minutes)
✅ Refresh: Refresh token for session renewal
✅ Storage: Store token in httpOnly cookie or secure storage
✅ Guards: @UseGuards(JwtAuthGuard) on protected routes
```

### Input Validation
```
✅ Backend: Always validate with DTOs
✅ Frontend: Validate for UX, not security
✅ Never trust client-side validation
✅ Sanitize all inputs
✅ Use class-validator (Nest.js)
✅ Use Zod or Yup (React)
```

### API Security
```
✅ CORS: Configure for specific origins
✅ Rate Limiting: Implement to prevent abuse
✅ HTTPS: Enforce in production
✅ Headers: Set security headers
✅ Versioning: /api/v1/ format for backwards compatibility
```

---

## 📊 E-COMMERCE / B2B SPECIFIC

### NOT Simple Shopping Cart
```
❌ WRONG: Assume typical e-commerce
✅ CORRECT: Support these scenarios:

1. Quick Quotation: Customer → Request custom quote → Salesman negotiates → Creates order
2. Bulk Order: Customer → Wants 10 units → Custom color → Custom delivery schedule
3. Project Order: Customer → Multi-phase delivery → 6 months → Investment model
4. Part Replacement: Existing customer → Needs spare parts → Fast fulfillment
5. Service: Installation + Training + Support → Bundled with equipment
```

### Features to Support
```
✅ Custom Quotations (not just cart checkout)
✅ Payment Terms (Net 30, Net 60, Prepay, etc.)
✅ Bulk Pricing (discount for quantity)
✅ Project-based Orders (phases, milestones)
✅ Customization Request (forms for specs)
✅ Document Management (contracts, agreements)
✅ Order History (for repeat customers)
✅ Support Ticketing (post-sale)
✅ Invoice Management (tracking, payments)
```

### Customer Types
```
1. Anonymous: Browse products, submit quotation request
2. Registered: Create account, track orders, manage profile
3. B2B Account: Company profile, credit terms, bulk pricing
4. VIP/Partner: Investment model, profit sharing, dedicated support
```

---

## 🧪 TESTING REQUIREMENTS

### Minimum Coverage
```
✅ 80% code coverage for critical business logic
✅ API endpoint testing (happy path + error cases)
✅ Database migration testing
✅ Authentication/Authorization testing
✅ Input validation testing
✅ Edge case testing
```

### Test Types
```
Backend:
  ✅ Unit Tests (Jest)
  ✅ Integration Tests
  ✅ E2E Tests

Frontend:
  ✅ Unit Tests (React Testing Library)
  ✅ Component Tests
  ✅ Integration Tests (basic)
```

---

## 📋 BEFORE IMPLEMENTING - AGENT CHECKLIST

For EVERY task, verify:

```
□ READ Project Context (Business-Description.md)
□ READ This File (AI Agent Master Instructions)
□ READ Implementation Guidelines (IMPLEMENTATION_GUIDELINES.md)
□ UNDERSTAND business model (Manufacturing + Operations + Investment)
□ CLARIFY brand usage (MIG vs Funtino)
□ CHECK theme system will be used
□ CHECK database design for flexibility
□ PLAN API structure and responses
□ PLAN test strategy
□ ASK if anything is unclear
□ NEVER assume, always verify
```

---

## 🆘 WHEN UNCERTAIN - DECISION TREE

```
Q: Should I hardcode this color?
→ NO. Use theme.config.ts

Q: Should I create a new table?
→ First check if JSON field works (flexibility)

Q: Should I skip input validation?
→ NO. Always validate at backend

Q: Should I trust frontend validation?
→ NO. Never trust frontend data

Q: Should I ignore SEO on this page?
→ NO. Every page must have metadata

Q: What if requirements conflict with guidelines?
→ ASK FOR CLARIFICATION. Don't assume.

Q: The old code doesn't follow guidelines - should I copy it?
→ NO. Follow current guidelines instead.

Q: Is consistency with existing code more important than guidelines?
→ NO. Guidelines take priority. Fix old code.
```

---

## 🔄 IMPORTANT FILES TO ALWAYS UPDATE TOGETHER

These files must stay in sync:

```
1. 0-DOCS/Business-Description.md
   ↓ (Reference for)
2. 0-DOCS/IMPLEMENTATION_GUIDELINES.md
   ↓ (Reference for)
3. 0-DOCS/AI_AGENT_MASTER_INSTRUCTIONS.md (this file)
   ↓ (Reference for actual implementation)
4. frontend/src/config/theme.config.ts
5. backend/src/config/database.config.ts
6. tailwind.config.ts
7. All modules and components
```

---

## 📞 COMMUNICATION

### When to Ask Questions
```
✅ If business requirements are unclear
✅ If conflicting with guidelines
✅ If architecture decision is major
✅ If unsure about data model
✅ If security implications are unclear
```

### When NOT to Ask (Just Follow Rules)
```
❌ Styling details → Use theme.config.ts
❌ API endpoint format → Use pattern
❌ Component structure → Use architecture
❌ Database field names → Use naming conventions
```

---

## 🚀 QUICK START FOR NEW AGENTS

1. **Read these 3 files in order:**
   1. `Business-Description.md`
   2. `IMPLEMENTATION_GUIDELINES.md`
   3. `AI_AGENT_MASTER_INSTRUCTIONS.md` (this file)

2. **Understand the model:**
   - MIG = Brand (Manufacturing + Operations + Investment)
   - Funtino = Operations brand only
   - E-commerce + B2B = Not simple shopping cart

3. **Key rules (memorize these):**
   - Theme from theme.config.ts ALWAYS
   - Database flexible (JSON + audit fields) ALWAYS
   - TypeScript strict ALWAYS
   - Validation backend ALWAYS
   - SEO on frontend ALWAYS

4. **Reference for implementation:**
   - Questions about business → Business-Description.md
   - Questions about architecture → IMPLEMENTATION_GUIDELINES.md
   - Questions about DO's/DON'Ts → This file

5. **Before coding:**
   - Check the checklist ✓
   - Use decision tree if uncertain ✓
   - Ask if needed ✓

---

## 📝 VERSION INFO
- **Created:** 2026-09-02
- **For:** All AI Agents, Assistants, Models
- **Status:** ACTIVE
- **Update Frequency:** As project evolves

---

## ⚠️ FINAL NOTES

```
This is NOT a suggestion document.
This is a REQUIREMENT document.
All agents MUST follow these guidelines.

When you see conflict between:
- Guidelines vs Old Code → Follow Guidelines
- Guidelines vs Convenience → Follow Guidelines
- Guidelines vs Time Pressure → Follow Guidelines

If something seems wrong → ASK
If something seems unclear → ASK
If something needs change → REQUEST CHANGE

NO ASSUMPTIONS. NO SHORTCUTS.
QUALITY OVER SPEED.
```

---

**🎯 Remember:** You're building a professional e-commerce platform for MIG.
This isn't a simple project. Follow the guidelines completely.

