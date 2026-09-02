# 📖 MIG Project - Complete Documentation Index

**Project:** MIG E-Commerce B2B Platform
**Client:** Mohammadi Industrial Group (MIG)
**Date Created:** 2026-09-02
**Status:** Implementation Ready

---

## 🎯 Quick Navigation

### 📚 Documentation Files (READ IN ORDER)

```
1. ✅ Business-Description.md
   └─ What: Complete business context
   └─ Why: Understand MIG's 3-pillar model
   └─ For: Everyone (MUST READ FIRST)

2. ✅ IMPLEMENTATION_GUIDELINES.md
   └─ What: Comprehensive implementation rules
   └─ Why: Technical architecture & standards
   └─ For: Developers & AI Agents

3. ✅ AI_AGENT_MASTER_INSTRUCTIONS.md
   └─ What: Instructions for AI Assistants
   └─ Why: Ensure consistent quality
   └─ For: Claude, GPT, all AI agents

4. ✅ DATABASE_SCHEMA_DETAILED.md
   └─ What: Complete database design
   └─ Why: Flexible B2B e-commerce support
   └─ For: Backend developers & DBAs

5. 📖 README.md (this file)
   └─ What: Project overview
   └─ Why: Quick reference
   └─ For: Everyone
```

---

## 🏢 Project Overview

### What is MIG?

**MIG = Mohammadi Industrial Group**

A specialized manufacturer & operator in the amusement equipment industry.

### Business Model (3 Pillars)

```
MIG (Main Brand)
│
├─ Manufacturing (تولید صنعتی)
│  ├─ Bumper car tracks (تمام اندازه‌ها)
│  ├─ Adult bumper cars (3+ models)
│  ├─ Children bumper cars (2 models)
│  └─ Spare parts (قطعات یدکی کاملا)
│
├─ Operations (بهره‌برداری)
│  └─ Funtino Brand (برند عملیاتی)
│     ├─ Frozen-themed Park
│     ├─ Arjomandi VR Park
│     └─ Multiple amusement parks
│
└─ Investment (سرمایه‌گذاری)
   ├─ Equipment supply for new projects
   ├─ Park development & setup
   └─ Partnership & profit sharing
```

### Key Facts
- 👥 Team: 15+ professionals
- 🏭 Specialty: Bumper cars & amusement equipment
- 🌍 International: ATRAX Exhibition (Turkey 2024)
- 📜 Certified: دولتی گواهینامه

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14+
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Forms:** React Hook Form + Zod validation

### Backend
- **Framework:** Nest.js 10+
- **Language:** TypeScript
- **Database:** PostgreSQL (primary) | SQLite (dev)
- **ORM:** TypeORM
- **Auth:** JWT + Passport.js

### Infrastructure
- **Hosting:** cPanel (معمول)
- **Process Manager:** PM2
- **Web Server:** Nginx
- **SSL:** Let's Encrypt

---

## 🎨 Theme System

### Key Principle
```
ALL styling comes from theme.config.ts
NEVER hardcode colors, fonts, or spacing
```

### How It Works
1. **Define** in `theme.config.ts` (central configuration)
2. **Use** in Tailwind classes or React hooks
3. **Manage** via Zustand store
4. **Extend** from Admin Panel (future)

### Example
```typescript
// ❌ WRONG
<Button style={{ backgroundColor: '#5470ff' }} />

// ✅ CORRECT
const { colors } = useTheme()
<Button className="bg-primary-500" />
```

---

## 💾 Database Design Philosophy

### Principles
1. **Flexibility:** Support custom orders & specifications
2. **Audit Trail:** Track all changes (created_at, updated_at, deleted_at)
3. **B2B Friendly:** Quotations, payment terms, projects
4. **E-Commerce:** Cart, orders, invoices, payments
5. **Scalable:** Proper indexing & foreign keys

### Special Features
- JSON fields for custom data (specifications, customizations)
- Soft deletes (never hard delete)
- Multi-currency support
- Role-based access control

### Core Tables
```
Users → Customers → Products → Orders → Invoices → Payments
         ↓                      ↓
    Quotations          Order Items
                              ↓
                        Customizations

Projects → Project Phases
Services
Spare Parts
Attachments
```

---

## 📋 Implementation Workflow

### Phase 1: Setup ✅
- [x] Project structure planned
- [x] Documentation complete
- [x] Guidelines defined
- [ ] Database created
- [ ] Backend scaffolded
- [ ] Frontend scaffolded

### Phase 2: Backend Development
- [ ] Database migrations
- [ ] Models & entities
- [ ] Authentication module
- [ ] Products module
- [ ] Orders module
- [ ] Quotations module
- [ ] Payments module
- [ ] Projects module

### Phase 3: Frontend Development
- [ ] Layout & theme setup
- [ ] Product catalog
- [ ] Product detail pages
- [ ] Quotation request form
- [ ] Login/Registration
- [ ] Dashboard
- [ ] Order management
- [ ] Profile management

### Phase 4: Integration & Polish
- [ ] API integration
- [ ] E2E testing
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Security audit
- [ ] Deployment

### Phase 5: Launch
- [ ] cPanel setup
- [ ] SSL certificate
- [ ] Database backup strategy
- [ ] Monitoring setup
- [ ] Go live!

---

## 📊 File Structure

```
d:\Tiam\Projects\Sites\Mohammadiig.ir\
│
├─ 0-DOCS/
│  ├─ Business-Description.md          ← Business context
│  ├─ IMPLEMENTATION_GUIDELINES.md      ← Technical rules
│  ├─ AI_AGENT_MASTER_INSTRUCTIONS.md   ← AI guidelines
│  ├─ DATABASE_SCHEMA_DETAILED.md       ← Database design
│  └─ README.md (this file)
│
├─ frontend/                            ← Next.js app
│  ├─ src/
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ config/
│  │  ├─ hooks/
│  │  ├─ store/
│  │  └─ types/
│  ├─ tailwind.config.ts
│  └─ package.json
│
├─ backend/                             ← Nest.js API
│  ├─ src/
│  │  ├─ config/
│  │  ├─ modules/
│  │  ├─ common/
│  │  └─ database/
│  ├─ package.json
│  └─ ormconfig.json
│
└─ .git/                                ← Version control
```

---

## 🚀 Quick Start

### 1. For New Developers

```bash
# 1. Read documentation in order:
#    1. Business-Description.md
#    2. IMPLEMENTATION_GUIDELINES.md
#    3. DATABASE_SCHEMA_DETAILED.md

# 2. Setup environment
npm install

# 3. Start backend
cd backend
npm run start:dev

# 4. Start frontend
cd frontend
npm run dev

# 5. Access
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

### 2. For AI Agents

```
BEFORE ANY WORK:
1. Read: Business-Description.md
2. Read: AI_AGENT_MASTER_INSTRUCTIONS.md
3. Reference: IMPLEMENTATION_GUIDELINES.md
4. Reference: DATABASE_SCHEMA_DETAILED.md

THEN: Check Implementation Checklist
```

### 3. For Designers

```
Theme System:
└─ All colors from: frontend/src/config/theme.config.ts
└─ All sizing from: Tailwind scale in same file
└─ All fonts from: theme.config.ts typography section

RULES:
✅ Use Tailwind classes
✅ Reference theme.config.ts for values
❌ NEVER hardcode colors/fonts
```

---

## 📞 Key Contacts & Support

### Documentation Reference
- **Business Questions:** → Business-Description.md
- **Technical Questions:** → IMPLEMENTATION_GUIDELINES.md
- **Database Questions:** → DATABASE_SCHEMA_DETAILED.md
- **AI Agent Issues:** → AI_AGENT_MASTER_INSTRUCTIONS.md

### Important Environment Variables
```
# Backend
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=mig_user
DB_PASSWORD=***
DB_NAME=mig_db

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ✅ Mandatory Checks

Before pushing any code:

```
□ Read relevant documentation
□ Follow TypeScript strict mode
□ Use theme system (no hardcoding)
□ Include error handling
□ Add validation (DTOs)
□ Write tests
□ Document API (Swagger)
□ Check SQL soft deletes
□ Implement pagination
□ Add logging
□ SEO on frontend pages
```

---

## 🎯 Project Goals

### Short Term (Phase 1-2)
- ✅ Professional e-commerce platform
- ✅ B2B quotation system
- ✅ Flexible order management
- ✅ Inventory tracking
- ✅ SEO-optimized

### Medium Term (Phase 3-4)
- Admin panel for settings
- Dynamic theme management
- Analytics dashboard
- Customer support system
- Mobile app readiness

### Long Term (Phase 5+)
- AI-powered recommendations
- Marketplace integration
- Multi-language support
- Advanced analytics
- Blockchain for contracts

---

## 📈 Success Metrics

```
Technical:
  ✅ 80% TypeScript strict compliance
  ✅ 100% API endpoints documented
  ✅ All database queries indexed
  ✅ Page load < 2s

Business:
  ✅ Complete product catalog
  ✅ Functional quotation system
  ✅ Full order lifecycle
  ✅ Multiple payment options

User Experience:
  ✅ Mobile responsive
  ✅ RTL (Persian) support
  ✅ Fast checkout
  ✅ Clear navigation
```

---

## 🔐 Security Checklist

```
✅ Passwords hashed (bcrypt)
✅ JWT authentication
✅ CORS configured
✅ Rate limiting implemented
✅ HTTPS enforced
✅ Input validation (backend)
✅ CSRF protection
✅ Security headers set
✅ SQL injection prevention
✅ XSS protection
```

---

## 📚 Learning Resources

### TypeScript
- Official: https://www.typescriptlang.org/docs/
- Handbook: https://www.typescriptlang.org/docs/handbook/

### Next.js
- Docs: https://nextjs.org/docs
- App Router: https://nextjs.org/docs/app

### Nest.js
- Docs: https://docs.nestjs.com
- TypeORM: https://typeorm.io

### PostgreSQL
- Docs: https://www.postgresql.org/docs/
- Query Guide: https://www.postgresql.org/docs/current/queries.html

### Tailwind CSS
- Docs: https://tailwindcss.com/docs
- Customization: https://tailwindcss.com/docs/configuration

---

## 🔄 Version History

| Version | Date       | Changes |
|---------|-----------|---------|
| 1.0     | 2026-09-02 | Initial release |
|         |            | Complete documentation |
|         |            | Database schema defined |
|         |            | AI guidelines written |

---

## 📝 Important Notes

```
⚠️ This is a PROFESSIONAL project
   - Quality over speed
   - Follow all guidelines
   - Ask if uncertain

🔒 Security is critical
   - Validate all inputs
   - Protect data
   - Use HTTPS always

🎯 User experience matters
   - Fast loading
   - Clear navigation
   - Responsive design

🔧 Technical debt prevention
   - Write tests
   - Document code
   - Follow standards
```

---

## 🙋 FAQ

**Q: Can I skip reading the documentation?**
A: ❌ NO. Read all 4 docs before starting.

**Q: What if guidelines conflict with business needs?**
A: Ask for clarification. Don't assume.

**Q: Should I hardcode colors?**
A: ❌ NO. Use theme.config.ts ALWAYS.

**Q: Is soft delete important?**
A: ✅ YES. Never hard delete.

**Q: Do I need to write tests?**
A: ✅ YES. Minimum 80% coverage.

**Q: What about RTL (Persian) support?**
A: ✅ REQUIRED. Configure from start.

---

## 📞 Support & Questions

```
For clarifications:
1. Check documentation first
2. Review decision tree in AI_AGENT_MASTER_INSTRUCTIONS.md
3. Ask project lead if still unclear

For issues:
1. Check IMPLEMENTATION_GUIDELINES.md
2. Check DATABASE_SCHEMA_DETAILED.md
3. Report with context & code sample
```

---

## 🎉 Ready to Build?

1. ✅ Read all documentation
2. ✅ Understand business model
3. ✅ Review tech stack
4. ✅ Check database schema
5. ✅ Follow guidelines
6. 🚀 Start building!

**Good luck! Let's build something amazing for MIG.**

---

**Last Updated:** 2026-09-02
**Next Review:** After Phase 1 completion

