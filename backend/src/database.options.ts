import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { ProductEntity } from './products/product.entity';
import { CategoryEntity } from './products/category.entity';
import { UserEntity } from './auth/user.entity';
import { CustomerEntity } from './customers/customer.entity';
import { QuotationEntity } from './quotations/quotation.entity';
import { OrderEntity } from './orders/order.entity';
import { OrderItemEntity } from './orders/order-item.entity';
import { InvoiceEntity } from './invoices/invoice.entity';
import { PaymentEntity } from './payments/payment.entity';
import { ProjectEntity } from './projects/project.entity';
import { ProjectPhaseEntity } from './projects/project-phase.entity';
import { ServiceEntity } from './services/service.entity';
import { AttachmentEntity } from './attachments/attachment.entity';
import { ProductVariantEntity } from './products/product-variant.entity';
import { ProductSpecificationEntity } from './products/product-specification.entity';
import { SparePartEntity } from './products/spare-part.entity';
import { SparePartCategoryEntity } from './products/spare-part-category.entity';
import { PortfolioWorkEntity } from './portfolio/portfolio-work.entity';
import { OrderCustomizationEntity } from './orders/order-customization.entity';
import { CreateProducts1710000000000 } from './database/migrations/1710000000000-create-products';
import { CreateProductCategories1710000001000 } from './database/migrations/1710000001000-create-product-categories';
import { CreateUsersCustomers1710000002000 } from './database/migrations/1710000002000-create-users-customers';
import { CreateQuotations1710000003000 } from './database/migrations/1710000003000-create-quotations';
import { CreateOrders1710000004000 } from './database/migrations/1710000004000-create-orders';
import { CreateInvoicesPayments1710000005000 } from './database/migrations/1710000005000-create-invoices-payments';
import { CreateProjectsServices1710000006000 } from './database/migrations/1710000006000-create-projects-services';
import { CreateAttachments1710000007000 } from './database/migrations/1710000007000-create-attachments';
import { CreateProductExtensions1710000008000 } from './database/migrations/1710000008000-create-product-extensions';
import { CreateOrderCustomizations1710000009000 } from './database/migrations/1710000009000-create-order-customizations';
import { CreateSparePartCategories1710000010000 } from './database/migrations/1710000010000-create-spare-part-categories';
import { PortfolioAndOpsProjects1710000011000 } from './database/migrations/1710000011000-portfolio-and-ops-projects';

const migrations = [
  CreateProducts1710000000000,
  CreateProductCategories1710000001000,
  CreateUsersCustomers1710000002000,
  CreateQuotations1710000003000,
  CreateOrders1710000004000,
  CreateInvoicesPayments1710000005000,
  CreateProjectsServices1710000006000,
  CreateAttachments1710000007000,
  CreateProductExtensions1710000008000,
  CreateOrderCustomizations1710000009000,
  CreateSparePartCategories1710000010000,
  PortfolioAndOpsProjects1710000011000,
];
const usePostgres = process.env.DB_DRIVER === 'postgres';

const entities = [
  ProductEntity,
  CategoryEntity,
  UserEntity,
  CustomerEntity,
  QuotationEntity,
  OrderEntity,
  OrderItemEntity,
  OrderCustomizationEntity,
  InvoiceEntity,
  PaymentEntity,
  ProjectEntity,
  ProjectPhaseEntity,
  ServiceEntity,
  AttachmentEntity,
  ProductVariantEntity,
  ProductSpecificationEntity,
  SparePartEntity,
  SparePartCategoryEntity,
  PortfolioWorkEntity,
];

export const databaseDataSourceOptions: DataSourceOptions = usePostgres
  ? {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities,
      migrations,
    }
  : {
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH ?? 'backend/data/mig.sqlite',
      entities,
      migrations,
    };

export const databaseOptions: TypeOrmModuleOptions = {
  ...databaseDataSourceOptions,
  autoLoadEntities: true,
  migrationsRun: true,
};
