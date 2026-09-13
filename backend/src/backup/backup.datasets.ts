import { EntityTarget, ObjectLiteral } from 'typeorm';
import { AttachmentEntity } from '../attachments/attachment.entity';
import { UserEntity } from '../auth/user.entity';
import { CustomerEntity } from '../customers/customer.entity';
import { InvoiceEntity } from '../invoices/invoice.entity';
import { MediaAssetEntity } from '../media/media.entity';
import { OrderCustomizationEntity } from '../orders/order-customization.entity';
import { OrderItemEntity } from '../orders/order-item.entity';
import { OrderEntity } from '../orders/order.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { PortfolioWorkEntity } from '../portfolio/portfolio-work.entity';
import { CategoryEntity } from '../products/category.entity';
import { ProductSpecificationEntity } from '../products/product-specification.entity';
import { ProductVariantEntity } from '../products/product-variant.entity';
import { ProductEntity } from '../products/product.entity';
import { SparePartCategoryEntity } from '../products/spare-part-category.entity';
import { SparePartEntity } from '../products/spare-part.entity';
import { ProjectPhaseEntity } from '../projects/project-phase.entity';
import { ProjectEntity } from '../projects/project.entity';
import { QuotationEntity } from '../quotations/quotation.entity';
import { ServiceEntity } from '../services/service.entity';

export type BackupDatasetKey =
  | 'categories'
  | 'products'
  | 'spare_part_categories'
  | 'spare_parts'
  | 'services'
  | 'portfolio'
  | 'projects'
  | 'users'
  | 'customers'
  | 'quotations'
  | 'orders'
  | 'invoices'
  | 'payments'
  | 'attachments'
  | 'media';

export type RestoreConflictMode = 'skip' | 'overwrite' | 'replace';

export type DatasetTableDef = {
  /** Logical table id inside the backup JSON */
  name: string;
  entity: EntityTarget<ObjectLiteral>;
  softDelete?: boolean;
};

export type BackupDatasetDef = {
  key: BackupDatasetKey;
  labelFa: string;
  descriptionFa: string;
  groupFa: string;
  /** Recommended restore order (lower first) */
  order: number;
  dependsOn: BackupDatasetKey[];
  tables: DatasetTableDef[];
  /** When true, binary media files are packed with the dataset */
  includesFiles?: boolean;
  warningFa?: string;
};

export const BACKUP_DATASETS: BackupDatasetDef[] = [
  {
    key: 'categories',
    labelFa: 'دسته‌بندی محصولات',
    descriptionFa: 'دسته‌های کاتالوگ محصول',
    groupFa: 'کاتالوگ',
    order: 10,
    dependsOn: [],
    tables: [{ name: 'product_categories', entity: CategoryEntity, softDelete: true }],
  },
  {
    key: 'products',
    labelFa: 'محصولات',
    descriptionFa: 'محصولات، مدل‌ها و مشخصات فنی',
    groupFa: 'کاتالوگ',
    order: 20,
    dependsOn: ['categories'],
    tables: [
      { name: 'products', entity: ProductEntity, softDelete: true },
      { name: 'product_variants', entity: ProductVariantEntity, softDelete: true },
      { name: 'product_specifications', entity: ProductSpecificationEntity },
    ],
  },
  {
    key: 'spare_part_categories',
    labelFa: 'دسته‌بندی قطعات',
    descriptionFa: 'دسته‌های قطعات یدکی',
    groupFa: 'پس از فروش',
    order: 30,
    dependsOn: [],
    tables: [{ name: 'spare_part_categories', entity: SparePartCategoryEntity, softDelete: true }],
  },
  {
    key: 'spare_parts',
    labelFa: 'قطعات یدکی',
    descriptionFa: 'لیست قطعات یدکی',
    groupFa: 'پس از فروش',
    order: 40,
    dependsOn: ['spare_part_categories'],
    tables: [{ name: 'spare_parts', entity: SparePartEntity, softDelete: true }],
  },
  {
    key: 'services',
    labelFa: 'خدمات',
    descriptionFa: 'خدمات پس از فروش و نصب',
    groupFa: 'پس از فروش',
    order: 50,
    dependsOn: [],
    tables: [{ name: 'services', entity: ServiceEntity, softDelete: true }],
  },
  {
    key: 'portfolio',
    labelFa: 'نمونه‌کارها',
    descriptionFa: 'آیتم‌های نمونه‌کار عمومی',
    groupFa: 'نمایش عمومی',
    order: 60,
    dependsOn: [],
    tables: [{ name: 'portfolio_works', entity: PortfolioWorkEntity, softDelete: true }],
  },
  {
    key: 'projects',
    labelFa: 'بهره‌برداری‌ها',
    descriptionFa: 'پروژه‌های بهره‌برداری و فازها',
    groupFa: 'نمایش عمومی',
    order: 70,
    dependsOn: [],
    tables: [
      { name: 'projects', entity: ProjectEntity, softDelete: true },
      { name: 'project_phases', entity: ProjectPhaseEntity },
    ],
  },
  {
    key: 'users',
    labelFa: 'کاربران',
    descriptionFa: 'حساب‌های کاربری، نقش‌ها و رمزهای هش‌شده',
    groupFa: 'سامانه',
    order: 80,
    dependsOn: [],
    tables: [{ name: 'users', entity: UserEntity, softDelete: true }],
    warningFa: 'شامل هش رمز عبور است؛ فایل را امن نگه دارید.',
  },
  {
    key: 'customers',
    labelFa: 'مشتریان',
    descriptionFa: 'پروفایل مشتریان سازمانی',
    groupFa: 'فروش',
    order: 90,
    dependsOn: ['users'],
    tables: [{ name: 'customers', entity: CustomerEntity, softDelete: true }],
  },
  {
    key: 'quotations',
    labelFa: 'پیش‌فاکتورها',
    descriptionFa: 'پیش‌فاکتورهای فروش',
    groupFa: 'فروش',
    order: 100,
    dependsOn: ['customers'],
    tables: [{ name: 'quotations', entity: QuotationEntity, softDelete: true }],
  },
  {
    key: 'orders',
    labelFa: 'سفارش‌ها',
    descriptionFa: 'سفارش‌ها، اقلام و سفارشی‌سازی‌ها',
    groupFa: 'فروش',
    order: 110,
    dependsOn: ['customers', 'products'],
    tables: [
      { name: 'orders', entity: OrderEntity, softDelete: true },
      { name: 'order_items', entity: OrderItemEntity },
      { name: 'order_customizations', entity: OrderCustomizationEntity },
    ],
  },
  {
    key: 'invoices',
    labelFa: 'فاکتورها',
    descriptionFa: 'فاکتورهای صادرشده',
    groupFa: 'مالی',
    order: 120,
    dependsOn: ['orders', 'customers'],
    tables: [{ name: 'invoices', entity: InvoiceEntity, softDelete: true }],
  },
  {
    key: 'payments',
    labelFa: 'پرداخت‌ها',
    descriptionFa: 'سوابق پرداخت',
    groupFa: 'مالی',
    order: 130,
    dependsOn: ['invoices'],
    tables: [{ name: 'payments', entity: PaymentEntity }],
  },
  {
    key: 'attachments',
    labelFa: 'فایل‌های پیوست',
    descriptionFa: 'متادیتای پیوست‌ها (آدرس فایل)',
    groupFa: 'سامانه',
    order: 140,
    dependsOn: [],
    tables: [{ name: 'attachments', entity: AttachmentEntity, softDelete: true }],
  },
  {
    key: 'media',
    labelFa: 'کتابخانه رسانه',
    descriptionFa: 'متادیتا و فایل‌های تصویر/ویدیو روی دیسک',
    groupFa: 'سامانه',
    order: 150,
    dependsOn: [],
    tables: [{ name: 'media_assets', entity: MediaAssetEntity, softDelete: true }],
    includesFiles: true,
    warningFa: 'حجم بک‌آپ با انتخاب این بخش ممکن است زیاد شود.',
  },
];

export const BACKUP_DATASET_MAP = Object.fromEntries(
  BACKUP_DATASETS.map((d) => [d.key, d]),
) as Record<BackupDatasetKey, BackupDatasetDef>;

export const ALL_DATASET_KEYS = BACKUP_DATASETS.map((d) => d.key);

export function sortDatasetsForRestore(keys: BackupDatasetKey[]): BackupDatasetKey[] {
  return [...keys].sort((a, b) => BACKUP_DATASET_MAP[a].order - BACKUP_DATASET_MAP[b].order);
}

export function sortDatasetsForClear(keys: BackupDatasetKey[]): BackupDatasetKey[] {
  return [...keys].sort((a, b) => BACKUP_DATASET_MAP[b].order - BACKUP_DATASET_MAP[a].order);
}
