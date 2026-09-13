function resolveApiUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').trim().replace(/\/+$/, '');
  if (!raw) return 'http://localhost:3001/api';
  // Nest global prefix is /api — accept either base form from env.
  return /\/api$/i.test(raw) ? raw : `${raw}/api`;
}

const API_URL = resolveApiUrl();

const PRODUCT_FIELD_LABELS: Record<string, string> = {
  nameFa: 'نام فارسی',
  nameEn: 'نام لاتین',
  slug: 'شناسه آدرس',
  sku: 'کد کالا',
  descriptionShortFa: 'توضیح کوتاه',
  category: 'دسته‌بندی',
  priceBase: 'قیمت پایه',
  thumbnailImageUrl: 'تصویر محصول',
  images: 'تصاویر محصول',
};

async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    const raw = body?.message;
    const messages = Array.isArray(raw) ? raw : typeof raw === 'string' && raw.trim() ? [raw] : [];
    if (messages.length === 0) return fallback;

    return messages
      .map((message) => {
        const longer = message.match(/^(\w+) must be longer than or equal to (\d+) characters$/);
        if (longer) {
          const label = PRODUCT_FIELD_LABELS[longer[1]] ?? longer[1];
          return `${label} باید حداقل ${Number(longer[2]).toLocaleString('fa-IR')} کاراکتر باشد.`;
        }
        const shorter = message.match(/^(\w+) must be shorter than or equal to (\d+) characters$/);
        if (shorter) {
          const label = PRODUCT_FIELD_LABELS[shorter[1]] ?? shorter[1];
          return `${label} باید حداکثر ${Number(shorter[2]).toLocaleString('fa-IR')} کاراکتر باشد.`;
        }
        if (message.includes('priceBase must be an integer number')) {
          return 'قیمت پایه باید عدد صحیح باشد.';
        }
        if (message.startsWith('property ') && message.endsWith(' should not exist')) {
          return fallback;
        }
        return message;
      })
      .join(' ');
  } catch {
    return fallback;
  }
}

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  sku?: string;
  slug: string;
  description: string;
  descriptionLong?: string | null;
  price: number;
  currency: 'IRR';
  category: string;
  image: string | null;
  images?: string[];
  isActive?: boolean;
  isFeatured: boolean;
  deletedAt?: string | null;
}

export type ProductSpecCategory = 'technical' | 'appearance';

export type ManageProductPayload = {
  nameFa: string;
  nameEn: string;
  slug: string;
  descriptionShortFa: string;
  descriptionLongFa?: string;
  sku: string;
  category: string;
  priceBase: number;
  images?: string[];
  thumbnailImageUrl?: string;
  isActive?: boolean;
  isFeatured?: boolean;
};

export type ManageProductSpecificationPayload = {
  specificationKey: string;
  specificationValue: string;
  unit?: string | null;
  specCategory: ProductSpecCategory;
  displayOrder?: number;
};

export type ManageProductVariantPayload = {
  skuVariant: string;
  variantNameFa: string;
  variantNameEn: string;
  variantCode?: string | null;
  priceBase?: number | null;
  priceAdjustment?: number;
  stockQuantity?: number;
  isActive?: boolean;
};

interface ProductListResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductCategory {
  id: string;
  nameEn: string;
  nameFa: string;
  slug: string;
  descriptionFa: string;
  displayOrder: number;
  isActive: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  companyName: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface QuotationSummary {
  id: string;
  quotationNumber: string;
  totalAmount: number;
  status: string;
  validUntil: string;
}

export interface OrderSummary { id: string; orderNumber: string; totalAmount: number; status: string; paymentStatus: string; }
export interface InvoiceSummary { id: string; invoiceNumber: string; orderId: string | null; totalAfterTax: number; paymentStatus: string; currency: string; }
export interface ServiceSummary {
  id: string;
  nameFa: string;
  description: string;
  serviceCategory: string;
  basePrice: number | null;
  unitType: string;
}

export interface OpsProject {
  id: string;
  projectCode: string;
  projectName: string;
  nameEn: string | null;
  slug: string | null;
  description: string;
  summaryFa: string | null;
  clientDisplayName: string | null;
  projectType: string;
  country: string | null;
  province: string | null;
  city: string | null;
  locationDetail: string | null;
  startDate: string | null;
  expectedCompletionDate: string | null;
  completionDate: string | null;
  budgetTotal: number;
  migInvestmentPercentage: number;
  profitSharingPercentage: number;
  status: string;
  coverImageUrl: string | null;
  gallery: string[];
  highlights: string[];
  isPublished: boolean;
}

export interface PortfolioWork {
  id: string;
  slug: string;
  titleFa: string;
  titleEn: string;
  summaryFa: string;
  descriptionFa: string;
  clientName: string | null;
  workCategory: string;
  country: string | null;
  province: string | null;
  city: string | null;
  locationDetail: string | null;
  startDate: string | null;
  endDate: string | null;
  coverImageUrl: string | null;
  gallery: string[];
  highlights: string[];
  areaOrCapacity: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

/** @deprecated use OpsProject — kept temporarily for type migrations */
export type ProjectSummary = OpsProject;
export type ProjectAdminSummary = OpsProject;
export interface ProductVariant {
  id: string;
  productId: string;
  skuVariant: string;
  variantNameFa: string;
  variantNameEn?: string;
  variantCode: string | null;
  priceBase: number | null;
  priceAdjustment: number;
  currency: string;
  stockQuantity: number;
  isActive?: boolean;
}
export interface ProductSpecification { id: string; productId: string; specificationKey: string; specificationValue: string; unit: string | null; specCategory: string; displayOrder: number; }
export interface SparePart {
  id: string;
  partNumber: string;
  nameFa: string;
  nameEn?: string;
  description: string;
  category: string;
  compatibleProducts: string[];
  price: number;
  currency: string;
  stockQuantity: number;
  reorderLevel?: number;
  warrantyMonths: number;
  imageUrl: string | null;
  isActive?: boolean;
}

export interface SparePartCategory {
  id: string;
  nameEn: string;
  nameFa: string;
  slug: string;
  descriptionFa: string;
  displayOrder: number;
  isActive: boolean;
}
export interface ProjectPhaseSummary { id: string; phaseNumber: number; phaseNameFa: string; description: string; startDate: string; endDate: string; status: string; }
export interface CustomerAdminSummary { id: string; companyName: string; contactPerson: string | null; phone: string | null; country: string | null; isVerified: boolean; paymentTerms: string; createdAt: string; }
export interface QuotationAdminSummary { id: string; quotationNumber: string; customerId: string; totalAmount: number; status: string; validUntil: string; }
export interface OrderAdminSummary { id: string; orderNumber: string; customerId: string; totalAmount: number; status: string; paymentStatus: string; createdAt: string; }
export interface InvoiceAdminSummary { id: string; invoiceNumber: string; customerId: string; orderId: string | null; totalAfterTax: number; paymentStatus: string; dueDate: string; }
export interface PaymentAdminSummary { id: string; invoiceId: string; orderId: string | null; amount: number; paymentMethod: string; paymentStatus: string; transactionId: string | null; }
export interface ServiceAdminSummary {
  id: string;
  nameFa: string;
  nameEn: string;
  description: string;
  serviceCategory: string;
  basePrice: number | null;
  unitType: string;
  isActive: boolean;
}
export interface AttachmentAdminSummary { id: string; ownerType: string; ownerId: string; fileName: string; fileUrl: string; fileSize: number | null; fileType: string | null; uploadedBy: string; uploadedAt: string; }
export interface UserAdminSummary { id: string; email: string; firstName: string | null; lastName: string | null; companyName: string | null; role: string; isActive: boolean; lastLoginAt: string | null; createdAt: string; }

export interface MediaAsset {
  id: string;
  originalName: string;
  storedName: string;
  relativePath: string;
  url: string;
  absoluteUrl: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  folder: string;
  altText: string | null;
  title: string | null;
  caption: string | null;
  description: string | null;
  checksum: string | null;
  parentId: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface MediaListResponse {
  data: MediaAsset[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    folders: string[];
  };
}

export interface MediaCompressionSettings {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  convertToWebp: boolean;
  stripMetadata: boolean;
  compressOnUpload: boolean;
}


export async function fetchProducts(): Promise<ProductListResponse> {
  const response = await fetch(`${API_URL}/products?limit=12`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Products request failed with status ${response.status}`);
  }

  return response.json() as Promise<ProductListResponse>;
}

export async function fetchProduct(slug: string): Promise<Product> {
  const response = await fetch(`${API_URL}/products/${slug}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Product request failed with status ${response.status}`);
  return response.json() as Promise<Product>;
}

export async function fetchProductVariants(productId: string): Promise<ProductVariant[]> {
  const response = await fetch(`${API_URL}/products/${productId}/variants`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت مدل‌های محصول انجام نشد.');
  return response.json() as Promise<ProductVariant[]>;
}

export async function fetchProductSpecifications(productId: string): Promise<ProductSpecification[]> {
  const response = await fetch(`${API_URL}/products/${productId}/specifications`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت مشخصات محصول انجام نشد.');
  return response.json() as Promise<ProductSpecification[]>;
}

export async function fetchCategories(): Promise<ProductCategory[]> {
  const response = await fetch(`${API_URL}/categories`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Categories request failed with status ${response.status}`);
  return response.json() as Promise<ProductCategory[]>;
}

export function fetchAdminCategories(accessToken: string): Promise<ProductCategory[]> {
  return adminRequest(accessToken, '/categories/admin/all');
}

export function createAdminCategory(
  accessToken: string,
  payload: {
    nameFa: string;
    nameEn: string;
    slug: string;
    descriptionFa: string;
    displayOrder?: number;
    isActive?: boolean;
  },
): Promise<ProductCategory> {
  return adminRequest(accessToken, '/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateAdminCategory(
  accessToken: string,
  id: string,
  payload: {
    nameFa: string;
    nameEn: string;
    slug: string;
    descriptionFa: string;
    displayOrder?: number;
    isActive?: boolean;
  },
): Promise<ProductCategory> {
  return adminRequest(accessToken, `/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminCategory(accessToken: string, id: string): Promise<void> {
  await adminRequest(accessToken, `/categories/${id}`, { method: 'DELETE' });
}

export async function fetchSparePartCategories(): Promise<SparePartCategory[]> {
  const response = await fetch(`${API_URL}/spare-part-categories`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت دسته‌بندی قطعات انجام نشد.');
  return response.json() as Promise<SparePartCategory[]>;
}

export function fetchAdminSparePartCategories(accessToken: string): Promise<SparePartCategory[]> {
  return adminRequest(accessToken, '/spare-part-categories/admin/all');
}

export function createAdminSparePartCategory(
  accessToken: string,
  payload: {
    nameFa: string;
    nameEn: string;
    slug: string;
    descriptionFa: string;
    displayOrder?: number;
    isActive?: boolean;
  },
): Promise<SparePartCategory> {
  return adminRequest(accessToken, '/spare-part-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateAdminSparePartCategory(
  accessToken: string,
  id: string,
  payload: {
    nameFa: string;
    nameEn: string;
    slug: string;
    descriptionFa: string;
    displayOrder?: number;
    isActive?: boolean;
  },
): Promise<SparePartCategory> {
  return adminRequest(accessToken, `/spare-part-categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminSparePartCategory(accessToken: string, id: string): Promise<void> {
  await adminRequest(accessToken, `/spare-part-categories/${id}`, { method: 'DELETE' });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return requestAuth('/login', { email, password });
}

export async function register(payload: { email: string; password: string; firstName: string; lastName: string; companyName: string; phone?: string }): Promise<AuthResponse> {
  return requestAuth('/register', payload);
}

export async function requestQuotation(accessToken: string, payload: { items: Array<{ productId: string; quantity: number; customizations?: Record<string, string> }>; notes?: string }): Promise<{ id: string; quotationNumber: string; totalAmount: number; status: string }> {
  const response = await fetch(`${API_URL}/quotations/request`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('ارسال درخواست پیش‌فاکتور انجام نشد.');
  return response.json() as Promise<{ id: string; quotationNumber: string; totalAmount: number; status: string }>;
}

export async function fetchMyQuotations(accessToken: string): Promise<QuotationSummary[]> {
  const response = await fetch(`${API_URL}/quotations/mine`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت پیش‌فاکتورها انجام نشد.');
  return response.json() as Promise<QuotationSummary[]>;
}

export async function acceptQuotation(accessToken: string, quotationId: string): Promise<QuotationSummary> {
  const response = await fetch(`${API_URL}/quotations/${quotationId}/accept`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error('پذیرش پیش‌فاکتور انجام نشد.');
  return response.json() as Promise<QuotationSummary>;
}

export async function convertQuotation(accessToken: string, quotationId: string): Promise<{ orderNumber: string; totalAmount: number; status: string }> {
  const response = await fetch(`${API_URL}/orders/from-quotation/${quotationId}`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error('تبدیل پیش‌فاکتور به سفارش انجام نشد.');
  return response.json() as Promise<{ orderNumber: string; totalAmount: number; status: string }>;
}

export async function fetchMyOrders(accessToken: string): Promise<OrderSummary[]> {
  const response = await fetch(`${API_URL}/orders/mine`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت سفارش‌ها انجام نشد.');
  return response.json() as Promise<OrderSummary[]>;
}

export async function fetchMyInvoices(accessToken: string): Promise<InvoiceSummary[]> {
  const response = await fetch(`${API_URL}/invoices/mine`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت فاکتورها انجام نشد.');
  return response.json() as Promise<InvoiceSummary[]>;
}

export async function submitPayment(accessToken: string, invoiceId: string, amount: number): Promise<{ paymentStatus: string }> {
  const response = await fetch(`${API_URL}/payments/${invoiceId}/pay`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ amount, paymentMethod: 'bank_transfer' }) });
  if (!response.ok) throw new Error('ثبت پرداخت انجام نشد.');
  return response.json() as Promise<{ paymentStatus: string }>;
}

export async function fetchServices(): Promise<ServiceSummary[]> {
  const response = await fetch(`${API_URL}/services`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت خدمات انجام نشد.');
  return response.json() as Promise<ServiceSummary[]>;
}

export async function fetchSpareParts(): Promise<SparePart[]> {
  const response = await fetch(`${API_URL}/spare-parts`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت قطعات یدکی انجام نشد.');
  return response.json() as Promise<SparePart[]>;
}

export function fetchAdminSpareParts(accessToken: string): Promise<SparePart[]> {
  return adminRequest(accessToken, '/spare-parts/admin/all');
}

export function createAdminSparePart(
  accessToken: string,
  payload: {
    partNumber: string;
    nameFa: string;
    nameEn: string;
    description: string;
    category: string;
    compatibleProducts?: string[];
    price: number;
    stockQuantity?: number;
    reorderLevel?: number;
    imageUrl?: string;
    warrantyMonths?: number;
    isActive?: boolean;
  },
): Promise<SparePart> {
  return adminRequest(accessToken, '/spare-parts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateAdminSparePart(
  accessToken: string,
  id: string,
  payload: {
    partNumber: string;
    nameFa: string;
    nameEn: string;
    description: string;
    category: string;
    compatibleProducts?: string[];
    price: number;
    stockQuantity?: number;
    reorderLevel?: number;
    imageUrl?: string;
    warrantyMonths?: number;
    isActive?: boolean;
  },
): Promise<SparePart> {
  return adminRequest(accessToken, `/spare-parts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminSparePart(accessToken: string, id: string): Promise<void> {
  await adminRequest(accessToken, `/spare-parts/${id}`, { method: 'DELETE' });
}

export async function fetchPublishedProjects(): Promise<OpsProject[]> {
  const response = await fetch(`${API_URL}/projects`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت پروژه‌ها انجام نشد.');
  return response.json() as Promise<OpsProject[]>;
}

export async function fetchPublishedProject(slug: string): Promise<OpsProject> {
  const response = await fetch(`${API_URL}/projects/${slug}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت پروژه انجام نشد.');
  return response.json() as Promise<OpsProject>;
}

export async function fetchPortfolioWorks(): Promise<PortfolioWork[]> {
  const response = await fetch(`${API_URL}/portfolio`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت نمونه‌کارها انجام نشد.');
  return response.json() as Promise<PortfolioWork[]>;
}

export async function fetchPortfolioWork(slug: string): Promise<PortfolioWork> {
  const response = await fetch(`${API_URL}/portfolio/${slug}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت نمونه‌کار انجام نشد.');
  return response.json() as Promise<PortfolioWork>;
}

export async function createProduct(accessToken: string, payload: ManageProductPayload): Promise<Product> {
  const response = await fetch(`${API_URL}/products`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'ایجاد محصول انجام نشد.'));
  return response.json() as Promise<Product>;
}

export async function updateProduct(accessToken: string, productId: string, payload: ManageProductPayload): Promise<Product> {
  const response = await fetch(`${API_URL}/products/${productId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'ویرایش محصول انجام نشد.'));
  return response.json() as Promise<Product>;
}

export async function deleteProduct(accessToken: string, productId: string): Promise<void> {
  const response = await fetch(`${API_URL}/products/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'حذف محصول انجام نشد.'));
}

export async function restoreProduct(accessToken: string, productId: string): Promise<Product> {
  const response = await fetch(`${API_URL}/products/${productId}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'بازیابی محصول انجام نشد.'));
  return response.json() as Promise<Product>;
}

export async function purgeProduct(accessToken: string, productId: string): Promise<void> {
  const response = await fetch(`${API_URL}/products/${productId}/purge`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'حذف دائم محصول انجام نشد.'));
}

export async function fetchAdminProducts(
  accessToken: string,
  status: 'active' | 'trash' | 'all' = 'active',
): Promise<Product[]> {
  const response = await fetch(`${API_URL}/products/admin/all?status=${encodeURIComponent(status)}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'دریافت محصولات انجام نشد.'));
  return response.json() as Promise<Product[]>;
}

export async function fetchAdminProduct(accessToken: string, productId: string): Promise<Product> {
  const response = await fetch(`${API_URL}/products/admin/${productId}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'دریافت محصول انجام نشد.'));
  return response.json() as Promise<Product>;
}

export async function fetchAdminProductSpecifications(
  accessToken: string,
  productId: string,
): Promise<ProductSpecification[]> {
  const response = await fetch(`${API_URL}/products/admin/${productId}/specifications`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'دریافت مشخصات انجام نشد.'));
  return response.json() as Promise<ProductSpecification[]>;
}

export async function fetchAdminProductVariants(
  accessToken: string,
  productId: string,
): Promise<ProductVariant[]> {
  const response = await fetch(`${API_URL}/products/admin/${productId}/variants`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'دریافت مدل‌ها انجام نشد.'));
  return response.json() as Promise<ProductVariant[]>;
}

export async function createProductSpecification(
  accessToken: string,
  productId: string,
  payload: ManageProductSpecificationPayload,
): Promise<ProductSpecification> {
  const response = await fetch(`${API_URL}/products/${productId}/specifications`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'افزودن مشخصات انجام نشد.'));
  return response.json() as Promise<ProductSpecification>;
}

export async function updateProductSpecification(
  accessToken: string,
  productId: string,
  specId: string,
  payload: ManageProductSpecificationPayload,
): Promise<ProductSpecification> {
  const response = await fetch(`${API_URL}/products/${productId}/specifications/${specId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'ویرایش مشخصات انجام نشد.'));
  return response.json() as Promise<ProductSpecification>;
}

export async function deleteProductSpecification(
  accessToken: string,
  productId: string,
  specId: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/products/${productId}/specifications/${specId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'حذف مشخصات انجام نشد.'));
}

export async function reorderProductSpecifications(
  accessToken: string,
  productId: string,
  orderedIds: string[],
): Promise<ProductSpecification[]> {
  const response = await fetch(`${API_URL}/products/${productId}/specifications/reorder`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'مرتب‌سازی مشخصات انجام نشد.'));
  return response.json() as Promise<ProductSpecification[]>;
}

export async function copyProductSpecs(
  accessToken: string,
  productId: string,
  sourceProductId: string,
  categories: ProductSpecCategory[],
): Promise<ProductSpecification[]> {
  const response = await fetch(`${API_URL}/products/${productId}/copy-specs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ sourceProductId, categories }),
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'کپی مشخصات انجام نشد.'));
  return response.json() as Promise<ProductSpecification[]>;
}

export async function createProductVariant(
  accessToken: string,
  productId: string,
  payload: ManageProductVariantPayload,
): Promise<ProductVariant> {
  const response = await fetch(`${API_URL}/products/${productId}/variants`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'افزودن مدل انجام نشد.'));
  return response.json() as Promise<ProductVariant>;
}

export async function updateProductVariant(
  accessToken: string,
  productId: string,
  variantId: string,
  payload: ManageProductVariantPayload,
): Promise<ProductVariant> {
  const response = await fetch(`${API_URL}/products/${productId}/variants/${variantId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'ویرایش مدل انجام نشد.'));
  return response.json() as Promise<ProductVariant>;
}

export async function deleteProductVariant(
  accessToken: string,
  productId: string,
  variantId: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/products/${productId}/variants/${variantId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'حذف مدل انجام نشد.'));
}

async function adminRequest<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(init?.headers ?? {}) }, cache: 'no-store' });
  if (!response.ok) throw new Error('عملیات پنل مدیریت انجام نشد.');
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function fetchAdminCustomers(accessToken: string): Promise<CustomerAdminSummary[]> { return adminRequest(accessToken, '/customers/admin/all'); }
export function updateCustomerVerified(accessToken: string, id: string, isVerified: boolean): Promise<CustomerAdminSummary> { return adminRequest(accessToken, `/customers/admin/${id}/verify`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isVerified }) }); }
export async function deleteAdminCustomer(accessToken: string, id: string): Promise<void> { await adminRequest(accessToken, `/customers/admin/${id}`, { method: 'DELETE' }); }
export function fetchAdminQuotations(accessToken: string): Promise<QuotationAdminSummary[]> { return adminRequest(accessToken, '/quotations/admin/all'); }
export function fetchAdminOrders(accessToken: string): Promise<OrderAdminSummary[]> { return adminRequest(accessToken, '/orders/admin/all'); }
export function updateQuotationStatus(accessToken: string, id: string, status: string): Promise<QuotationAdminSummary> { return adminRequest(accessToken, `/quotations/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); }
export function updateOrderStatus(accessToken: string, id: string, status: string): Promise<OrderAdminSummary> { return adminRequest(accessToken, `/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); }
export function fetchAdminProjects(accessToken: string): Promise<OpsProject[]> {
  return adminRequest(accessToken, '/projects/admin/all');
}

export function createAdminProject(
  accessToken: string,
  payload: Record<string, unknown>,
): Promise<OpsProject> {
  return adminRequest(accessToken, '/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateAdminProject(
  accessToken: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<OpsProject> {
  return adminRequest(accessToken, `/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminProject(accessToken: string, id: string): Promise<void> {
  await adminRequest(accessToken, `/projects/${id}`, { method: 'DELETE' });
}

export function updateProjectStatus(accessToken: string, id: string, status: string): Promise<OpsProject> {
  return adminRequest(accessToken, `/projects/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function fetchAdminPortfolio(accessToken: string): Promise<PortfolioWork[]> {
  return adminRequest(accessToken, '/portfolio/admin/all');
}

export function createAdminPortfolio(
  accessToken: string,
  payload: Record<string, unknown>,
): Promise<PortfolioWork> {
  return adminRequest(accessToken, '/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateAdminPortfolio(
  accessToken: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<PortfolioWork> {
  return adminRequest(accessToken, `/portfolio/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminPortfolio(accessToken: string, id: string): Promise<void> {
  await adminRequest(accessToken, `/portfolio/${id}`, { method: 'DELETE' });
}

export function fetchAdminInvoices(accessToken: string): Promise<InvoiceAdminSummary[]> { return adminRequest(accessToken, '/invoices/admin/all'); }
export function updateInvoiceStatus(accessToken: string, id: string, status: string): Promise<InvoiceAdminSummary> { return adminRequest(accessToken, `/invoices/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); }
export function fetchAdminPayments(accessToken: string): Promise<PaymentAdminSummary[]> { return adminRequest(accessToken, '/payments/admin/all'); }
export function updatePaymentStatus(accessToken: string, id: string, status: string): Promise<PaymentAdminSummary> { return adminRequest(accessToken, `/payments/admin/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); }
export function fetchAdminServices(accessToken: string): Promise<ServiceAdminSummary[]> { return adminRequest(accessToken, '/services/admin/all'); }
export function createAdminService(accessToken: string, payload: { nameFa: string; nameEn: string; description: string; serviceCategory: string; basePrice?: number | null; unitType: string; isActive?: boolean }): Promise<ServiceAdminSummary> { return adminRequest(accessToken, '/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); }
export function updateAdminService(accessToken: string, id: string, payload: Partial<{ nameFa: string; nameEn: string; description: string; serviceCategory: string; basePrice: number | null; unitType: string; isActive: boolean }>): Promise<ServiceAdminSummary> { return adminRequest(accessToken, `/services/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); }
export function fetchAdminAttachments(accessToken: string): Promise<AttachmentAdminSummary[]> { return adminRequest(accessToken, '/attachments/admin/all'); }
export function createAdminAttachment(accessToken: string, payload: { ownerType: string; ownerId: string; fileName: string; fileUrl: string; fileSize?: number; fileType?: string }): Promise<AttachmentAdminSummary> { return adminRequest(accessToken, '/attachments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); }
export async function deleteAdminAttachment(accessToken: string, id: string): Promise<void> { await adminRequest(accessToken, `/attachments/admin/${id}`, { method: 'DELETE' }); }

export function fetchMediaLibrary(
  accessToken: string,
  params?: { q?: string; folder?: string; status?: string; kind?: string; page?: number; limit?: number },
): Promise<MediaListResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.folder) query.set('folder', params.folder);
  if (params?.status) query.set('status', params.status);
  if (params?.kind && params.kind !== 'all') query.set('kind', params.kind);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query}` : '';
  return adminRequest(accessToken, `/media${suffix}`);
}

export function fetchMediaSettings(accessToken: string): Promise<MediaCompressionSettings> {
  return adminRequest(accessToken, '/media/settings');
}

export function updateMediaSettings(
  accessToken: string,
  payload: Partial<MediaCompressionSettings>,
): Promise<MediaCompressionSettings> {
  return adminRequest(accessToken, '/media/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function uploadMediaAsset(
  accessToken: string,
  file: File,
  meta?: {
    folder?: string;
    altText?: string;
    title?: string;
    caption?: string;
    description?: string;
    kind?: 'image' | 'video';
  },
): Promise<MediaAsset> {
  const body = new FormData();
  body.append('file', file);
  if (meta?.folder) body.append('folder', meta.folder);
  if (meta?.altText) body.append('altText', meta.altText);
  if (meta?.title) body.append('title', meta.title);
  if (meta?.caption) body.append('caption', meta.caption);
  if (meta?.description) body.append('description', meta.description);
  if (meta?.kind) body.append('kind', meta.kind);
  const response = await fetch(`${API_URL}/media/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    body,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('آپلود فایل انجام نشد.');
  return response.json() as Promise<MediaAsset>;
}

export function updateMediaAsset(
  accessToken: string,
  id: string,
  payload: Partial<{
    altText: string | null;
    title: string | null;
    caption: string | null;
    description: string | null;
    folder: string;
    originalName: string;
  }>,
): Promise<MediaAsset> {
  return adminRequest(accessToken, `/media/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function compressMediaAsset(
  accessToken: string,
  id: string,
  payload: {
    mode?: 'replace' | 'copy';
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    convertToWebp?: boolean;
    stripMetadata?: boolean;
  },
): Promise<MediaAsset> {
  return adminRequest(accessToken, `/media/${id}/compress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteMediaAsset(accessToken: string, id: string): Promise<void> {
  await adminRequest(accessToken, `/media/${id}`, { method: 'DELETE' });
}

export function restoreMediaAsset(accessToken: string, id: string): Promise<MediaAsset> {
  return adminRequest(accessToken, `/media/${id}/restore`, { method: 'POST' });
}

export async function purgeMediaAsset(accessToken: string, id: string): Promise<void> {
  await adminRequest(accessToken, `/media/${id}/purge`, { method: 'DELETE' });
}

export async function downloadMediaBackup(accessToken: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/media/backup/download`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('دریافت بک‌آپ انجام نشد.');
  return response.blob();
}

export async function restoreMediaBackup(accessToken: string, file: File): Promise<{ restored: number; skipped: number }> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${API_URL}/media/backup/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    body,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('بازیابی بک‌آپ انجام نشد.');
  return response.json() as Promise<{ restored: number; skipped: number }>;
}

export function fetchAdminUsers(accessToken: string): Promise<UserAdminSummary[]> { return adminRequest(accessToken, '/users/admin/all'); }
export function updateUserRole(accessToken: string, id: string, role: string): Promise<UserAdminSummary> { return adminRequest(accessToken, `/users/${id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) }); }
export function updateUserActive(accessToken: string, id: string, isActive: boolean): Promise<UserAdminSummary> { return adminRequest(accessToken, `/users/${id}/active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) }); }

async function requestAuth(path: string, body: object): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error('اطلاعات ورود یا ثبت‌نام صحیح نیست.');
  return response.json() as Promise<AuthResponse>;
}
