import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";
import { ProductEntity } from "./products/product.entity";
import { CategoryEntity } from "./products/category.entity";
import { UserEntity } from "./auth/user.entity";
import { CustomerEntity } from "./customers/customer.entity";
import { QuotationEntity } from "./quotations/quotation.entity";
import { OrderEntity } from "./orders/order.entity";
import { OrderItemEntity } from "./orders/order-item.entity";
import { InvoiceEntity } from "./invoices/invoice.entity";
import { PaymentEntity } from "./payments/payment.entity";
import { ProjectEntity } from "./projects/project.entity";
import { ProjectPhaseEntity } from "./projects/project-phase.entity";
import { ServiceEntity } from "./services/service.entity";
import { AttachmentEntity } from "./attachments/attachment.entity";
import { ProductVariantEntity } from "./products/product-variant.entity";
import { ProductSpecificationEntity } from "./products/product-specification.entity";
import { SparePartEntity } from "./products/spare-part.entity";
import { SparePartCategoryEntity } from "./products/spare-part-category.entity";
import { PortfolioWorkEntity } from "./portfolio/portfolio-work.entity";
import { OrderCustomizationEntity } from "./orders/order-customization.entity";
import { CreateProducts1710000000000 } from "./database/migrations/1710000000000-create-products";
import { CreateProductCategories1710000001000 } from "./database/migrations/1710000001000-create-product-categories";
import { CreateUsersCustomers1710000002000 } from "./database/migrations/1710000002000-create-users-customers";
import { CreateQuotations1710000003000 } from "./database/migrations/1710000003000-create-quotations";
import { CreateOrders1710000004000 } from "./database/migrations/1710000004000-create-orders";
import { CreateInvoicesPayments1710000005000 } from "./database/migrations/1710000005000-create-invoices-payments";
import { CreateProjectsServices1710000006000 } from "./database/migrations/1710000006000-create-projects-services";
import { CreateAttachments1710000007000 } from "./database/migrations/1710000007000-create-attachments";
import { CreateProductExtensions1710000008000 } from "./database/migrations/1710000008000-create-product-extensions";
import { CreateOrderCustomizations1710000009000 } from "./database/migrations/1710000009000-create-order-customizations";
import { CreateSparePartCategories1710000010000 } from "./database/migrations/1710000010000-create-spare-part-categories";
import { PortfolioAndOpsProjects1710000011000 } from "./database/migrations/1710000011000-portfolio-and-ops-projects";
import { CreateMediaLibrary1710000012000 } from "./database/migrations/1710000012000-create-media-library";
import { ProductGallery1710000013000 } from "./database/migrations/1710000013000-product-gallery";
import { ProductDescriptionLong1710000014000 } from "./database/migrations/1710000014000-product-description-long";
import { PhoneOtpAuth1710000015000 } from "./database/migrations/1710000015000-phone-otp-auth";
import { NormalizeMediaUrls1710000016000 } from "./database/migrations/1710000016000-normalize-media-urls";
import { NormalizeSparePartMediaUrls1710000017000 } from "./database/migrations/1710000017000-normalize-spare-part-media-urls";
import { PriceNegotiableAndServiceMedia1710000018000 } from "./database/migrations/1710000018000-price-negotiable-and-service-media";
import { SparePartPriceNegotiable1710000019000 } from "./database/migrations/1710000019000-spare-part-price-negotiable";
import { SparePartsCommerce1710000020000 } from "./database/migrations/1710000020000-spare-parts-commerce";
import { CustomerLifecycle1710000021000 } from "./database/migrations/1710000021000-customer-lifecycle";
import { UniqueQuotationOrder1710000022000 } from "./database/migrations/1710000022000-unique-quotation-order";
import { PaymentIntegrityAudit1710000023000 } from "./database/migrations/1710000023000-payment-integrity-audit";
import { AuditEntity } from "./audit/audit.entity";
import { ProductCategoryId1710000026000 } from "./database/migrations/1710000026000-product-category-id";
import { SessionEntity } from "./auth/session.entity";
import { AuthSessions1710000024000 } from "./database/migrations/1710000024000-auth-sessions";
import { QuotationAcceptance1710000025000 } from "./database/migrations/1710000025000-quotation-acceptance";
import { MediaAssetEntity } from "./media/media.entity";
import { OtpChallengeEntity } from "./auth/otp-challenge.entity";

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
  CreateMediaLibrary1710000012000,
  ProductGallery1710000013000,
  ProductDescriptionLong1710000014000,
  PhoneOtpAuth1710000015000,
  NormalizeMediaUrls1710000016000,
  NormalizeSparePartMediaUrls1710000017000,
  PriceNegotiableAndServiceMedia1710000018000,
  SparePartPriceNegotiable1710000019000,
  SparePartsCommerce1710000020000,
  CustomerLifecycle1710000021000,
  UniqueQuotationOrder1710000022000,
  PaymentIntegrityAudit1710000023000,
  AuthSessions1710000024000,
  QuotationAcceptance1710000025000,
  ProductCategoryId1710000026000,
];

const entities = [
  AuditEntity,
  ProductCategoryId1710000026000,
  SessionEntity,
  ProductEntity,
  CategoryEntity,
  UserEntity,
  OtpChallengeEntity,
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
  MediaAssetEntity,
];

function resolveUsePostgres(): boolean {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const driverHint = (process.env.DB_DRIVER ?? "").trim().toLowerCase();
  return (
    driverHint === "postgres" ||
    Boolean(databaseUrl && /^postgres(ql)?:\/\//i.test(databaseUrl))
  );
}

function maskDatabaseUrl(url: string): string {
  return url.replace(/:[^:@/]+@/, ":***@");
}

/** Build DB options at call-time so platform env vars are already injected. */
export function buildDatabaseDataSourceOptions(): DataSourceOptions {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const usePostgres = resolveUsePostgres();
  const sqlitePath = process.env.DATABASE_PATH ?? "backend/data/mig.sqlite";

  console.log(
    usePostgres
      ? `[DB] driver=postgres migrationsRun=true url=${databaseUrl ? maskDatabaseUrl(databaseUrl) : "(missing DATABASE_URL)"}`
      : `[DB] driver=better-sqlite3 migrationsRun=true path=${sqlitePath}`,
  );

  if (usePostgres && !databaseUrl) {
    throw new Error("[DB] DATABASE_URL is required when DB_DRIVER=postgres");
  }

  return usePostgres
    ? {
        type: "postgres",
        url: databaseUrl,
        entities,
        migrations,
        synchronize: false,
        migrationsRun: true,
        logging: ["error", "warn", "migration", "schema"],
      }
    : {
        type: "better-sqlite3",
        database: sqlitePath,
        entities,
        migrations,
        synchronize: false,
        migrationsRun: true,
        logging: ["error", "warn", "migration", "schema"],
      };
}

export function buildDatabaseOptions(): TypeOrmModuleOptions {
  return {
    ...buildDatabaseDataSourceOptions(),
    autoLoadEntities: true,
    migrationsRun: true,
    retryAttempts: 10,
    retryDelay: 3000,
  };
}

/** Lazy getter for TypeORM CLI — call after env is loaded. */
export function getDatabaseDataSourceOptions(): DataSourceOptions {
  return buildDatabaseDataSourceOptions();
}
