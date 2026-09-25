// Browser credentials travel only in the same-origin HttpOnly session cookie.
async function fetch(input: string, init?: RequestInit): Promise<Response> {
  if (typeof window === 'undefined') return globalThis.fetch(input, init);
  const headers = new Headers(init?.headers);
  headers.delete('Authorization');
  headers.set('X-Mig-Csrf', '1');
  const response = await globalThis.fetch(input, { ...init, headers, credentials: 'same-origin' });
  if (response.status === 401 && !input.includes('/auth/')) window.dispatchEvent(new Event('mig-session-expired'));
  if (response.status === 403) window.dispatchEvent(new Event('mig-forbidden'));
  return response;
}

function normalizeApiBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

function isLoopbackApiBase(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
  } catch {
    return false;
  }
}

/**
 * Resolve API base for fetch().
 * - Browser + unset/loopback config → same-origin `/api` (Next rewrites to Nest).
 *   This is what makes LAN / mobile work; never call the device's localhost.
 * - Production with a real API host → NEXT_PUBLIC_API_URL as-is.
 * - SSR → hit Nest on the machine running Next (API_INTERNAL_URL or 127.0.0.1).
 */
export function getApiUrl(): string {
  const configured = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL ?? '');
  const internal =
    normalizeApiBase(process.env.API_INTERNAL_URL ?? '') || 'http://127.0.0.1:3001/api';

  if (typeof window !== 'undefined') {
    return '/api';
  }

  if (configured && !isLoopbackApiBase(configured)) return configured;
  return internal;
}

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
        if (
          message === 'Invalid or expired token' ||
          /invalid or expired token/i.test(message) ||
          message === 'Authentication required'
        ) {
          return 'نشست منقضی یا نامعتبر است. دوباره وارد شوید.';
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
  priceNegotiable?: boolean;
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
  slug: string;
  nameEn?: string;
  descriptionShortFa?: string;
  descriptionLongFa?: string;
  sku?: string;
  category?: string;
  priceBase?: number;
  priceNegotiable?: boolean;
  images?: string[];
  thumbnailImageUrl?: string;
  /** false = پیش‌نویس، true = منتشرشده */
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
  email: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  companyName: string | null;
  twoFactorEnabled?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export type OtpPurpose = 'login' | 'register' | 'forgot_password' | 'change_mobile';

export interface OtpSendResponse {
  challengeId: string;
  phoneMasked: string;
  expiresIn: number;
  resendAfter: number;
  purpose: string;
  debugCode?: string;
}

export type OtpVerifyResponse =
  | ({ nextStep: 'done' } & AuthResponse)
  | { nextStep: 'password'; passwordToken: string; expiresIn: number }
  | { nextStep: 'profile'; registrationToken: string; expiresIn: number }
  | { nextStep: 'new_password'; resetToken: string; expiresIn: number }
  | { nextStep: 'new_mobile'; changeToken: string; expiresIn: number; phoneMasked: string };

export interface QuotationItemSummary {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customizations?: Record<string, string>;
}

export interface QuotationSummary {
  id: string;
  quotationNumber: string;
  totalAmount: number;
  status: string;
  validUntil: string;
  items?: QuotationItemSummary[];
  notes?: string | null;
  createdAt?: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerId?: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  orderType?: string;
  currency?: string;
  createdAt?: string;
}

export interface InvoiceLineItem {
  itemType: string;
  sparePartId?: string | null;
  productId?: string | null;
  title: string;
  sku: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
}

export interface InvoicePartySnapshot {
  customerId: string;
  userId?: string;
  companyName?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  industry?: string | null;
  registrationNumber?: string | null;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  orderId: string | null;
  totalAfterTax: number;
  totalBeforeTax?: number;
  taxAmount?: number;
  paymentStatus: string;
  currency: string;
  dueDate?: string;
  notes?: string | null;
  lineItemsJson?: InvoiceLineItem[];
  customerSnapshotJson?: InvoicePartySnapshot;
  shippingSnapshotJson?: Record<string, string>;
  billingSnapshotJson?: Record<string, string>;
  paymentMethod?: string | null;
  paidAt?: string | null;
  createdAt?: string;
}

export interface OrderItemSummary {
  id: string;
  orderId: string;
  itemType: string;
  productId: string;
  sparePartId: string | null;
  titleSnapshot: string | null;
  skuSnapshot: string | null;
  imageSnapshot: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
}

export interface OrderDetail extends OrderSummary {
  shippingAddress?: Record<string, string>;
  billingAddress?: Record<string, string>;
  subtotal?: number;
  taxAmount?: number;
  shippingCost?: number;
  discountAmount?: number;
  notes?: string | null;
  items: OrderItemSummary[];
  invoice?: InvoiceSummary | null;
}

export interface SparePartsCheckoutPayload {
  items: Array<{ sparePartId: string; quantity: number }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    address: string;
    postalCode?: string;
    province?: string;
  };
  billingAddress?: SparePartsCheckoutPayload['shippingAddress'];
  notes?: string;
  payWithTestGateway?: boolean;
}

export interface SparePartsCheckoutResult {
  order: OrderSummary;
  invoice: InvoiceSummary;
  payment?: { id: string; paymentStatus: string; transactionId: string | null } | null;
}

export interface Customer360 {
  customer: Omit<CustomerAdminSummary, 'isActive'> & {
    userId: string;
    address?: string | null;
    city?: string | null;
    industry?: string | null;
    companyRegistrationNumber?: string | null;
    notes?: string | null;
  };
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    role: string;
    createdAt: string;
    lastLoginAt: string | null;
  } | null;
  orders: OrderDetail[];
  invoices: InvoiceSummary[];
  payments: PaymentAdminSummary[];
  quotations: QuotationAdminSummary[];
  stats: {
    ordersCount: number;
    invoicesCount: number;
    paidTotal: number;
    unpaidTotal: number;
    sparePartsOrdersCount: number;
  };
}
export interface ServiceSummary {
  id: string;
  nameFa: string;
  description: string;
  serviceCategory: string;
  basePrice: number | null;
  priceNegotiable?: boolean;
  unitType: string;
  coverImageUrl?: string | null;
  gallery?: string[];
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
  priceBase?: number | null;
  priceNegotiable?: boolean;
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
  slug?: string | null;
  nameFa: string;
  nameEn?: string;
  shortDescription?: string | null;
  description: string;
  category: string;
  compatibleProducts: string[];
  price: number;
  priceNegotiable?: boolean;
  currency: string;
  stockQuantity: number;
  reorderLevel?: number;
  warrantyMonths: number;
  imageUrl: string | null;
  gallery?: string[];
  brand?: string | null;
  oemCode?: string | null;
  weightGrams?: number | null;
  dimensions?: string | null;
  specs?: Array<{ key: string; value: string; unit?: string }>;
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
export interface CustomerAdminSummary { id: string; companyName: string | null; contactPerson: string | null; phone: string | null; country: string | null; isVerified: boolean; isActive: boolean; status: import('./customer-status').CustomerStatus; statusReason: string | null; statusChangedAt: string | null; deletedAt: string | null; paymentTerms: string; createdAt: string; }
export interface QuotationAdminSummary {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerCompanyName: string | null;
  customerContactPerson: string | null;
  customerPhone: string | null;
  totalAmount: number;
  subtotal?: number;
  status: string;
  validUntil: string;
  notes: string | null;
  items: QuotationItemSummary[];
  createdAt: string;
  updatedAt?: string;
}
export interface OrderAdminSummary {
  id: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  orderType?: string;
}
export interface InvoiceAdminSummary { id: string; invoiceNumber: string; customerId: string; orderId: string | null; totalAfterTax: number; paymentStatus: string; dueDate: string; }
export interface PaymentAdminSummary { id: string; invoiceId: string; orderId: string | null; amount: number; paymentMethod: string; paymentStatus: string; transactionId: string | null; }
export interface AdminListMeta { page: number; limit: number; total: number; totalPages: number; }
export interface AdminListResponse<T> { data: T[]; meta: AdminListMeta; }
export interface ServiceAdminSummary {
  id: string;
  nameFa: string;
  nameEn: string;
  description: string;
  serviceCategory: string;
  basePrice: number | null;
  priceNegotiable?: boolean;
  unitType: string;
  coverImageUrl?: string | null;
  gallery?: string[];
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


export async function fetchProducts(options?: {
  limit?: number;
  page?: number;
  category?: string;
}): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(options?.limit ?? 12));
  params.set('page', String(options?.page ?? 1));
  if (options?.category) params.set('category', options.category);

  const response = await fetch(`${getApiUrl()}/products?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('دریافت فهرست محصولات انجام نشد.');
  }

  return response.json() as Promise<ProductListResponse>;
}

export async function fetchProduct(slug: string): Promise<Product> {
  const response = await fetch(`${getApiUrl()}/products/${slug}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Product request failed with status ${response.status}`);
  return response.json() as Promise<Product>;
}

export async function fetchProductVariants(productId: string): Promise<ProductVariant[]> {
  const response = await fetch(`${getApiUrl()}/products/${productId}/variants`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت مدل‌های محصول انجام نشد.');
  return response.json() as Promise<ProductVariant[]>;
}

export async function fetchProductSpecifications(productId: string): Promise<ProductSpecification[]> {
  const response = await fetch(`${getApiUrl()}/products/${productId}/specifications`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت مشخصات محصول انجام نشد.');
  return response.json() as Promise<ProductSpecification[]>;
}

export async function fetchCategories(): Promise<ProductCategory[]> {
  const response = await fetch(`${getApiUrl()}/categories`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Categories request failed with status ${response.status}`);
  return response.json() as Promise<ProductCategory[]>;
}

export function fetchAdminCategories(accessToken: string): Promise<ProductCategory[]> {
  return adminRequest(accessToken, '/categories/admin/all');
}
export interface AdminPageMeta { page: number; limit: number; total: number; totalPages: number }
export interface AdminPage<T> { data: T[]; meta: AdminPageMeta }

export interface AdminDashboardMetrics {
  products: number; categories: number; customers: number; users: number; newRequests: number;
  pendingQuotations: number; activeOrders: number; pendingPayments: number; unpaidInvoices: number;
  health: { backend: 'ok' | 'error'; database: 'ok' | 'error' };
}
export function fetchAdminDashboard(accessToken: string): Promise<{ data: AdminDashboardMetrics; generatedAt: string }> {
  return adminRequest(accessToken, '/dashboard/admin');
}
export function fetchAdminCategoriesPage(accessToken: string, options: { page?: number; limit?: number; search?: string } = {}): Promise<AdminListResponse<ProductCategory>> { return fetchAdminPage(accessToken, '/categories/admin/all', options); }

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
  const response = await fetch(`${getApiUrl()}/spare-part-categories?page=1&limit=100`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت دسته‌بندی قطعات انجام نشد.');
  const body = (await response.json()) as AdminPage<SparePartCategory> | SparePartCategory[];
  return Array.isArray(body) ? body : body.data;
}

export async function fetchSparePartCategoriesPage(params?: { page?: number; limit?: number; q?: string }): Promise<AdminPage<SparePartCategory>> {
  const search = new URLSearchParams({ page: String(params?.page ?? 1), limit: String(params?.limit ?? 20) });
  if (params?.q) search.set('q', params.q);
  const response = await fetch(`${getApiUrl()}/spare-part-categories?${search}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت دسته‌بندی قطعات انجام نشد.');
  return response.json() as Promise<AdminPage<SparePartCategory>>;
}

export function fetchAdminSparePartCategories(accessToken: string): Promise<SparePartCategory[]> {
  return fetchAdminSparePartCategoriesPage(accessToken, { page: 1, limit: 100 }).then((body) => body.data);
}
export function fetchAdminSparePartCategoriesPage(accessToken: string, params?: { page?: number; limit?: number; q?: string }): Promise<AdminPage<SparePartCategory>> {
  const search = new URLSearchParams({ page: String(params?.page ?? 1), limit: String(params?.limit ?? 20) });
  if (params?.q) search.set('q', params.q);
  return adminRequest(accessToken, `/spare-part-categories/admin/all?${search}`);
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

export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone?: string;
}): Promise<AuthResponse> {
  return requestAuth('/register', payload);
}

export async function sendOtp(phone: string, purpose: OtpPurpose): Promise<OtpSendResponse> {
  return requestAuthJson('/otp/send', { phone, purpose });
}

export async function resendOtp(challengeId: string): Promise<OtpSendResponse> {
  return requestAuthJson('/otp/resend', { challengeId });
}

export async function verifyOtp(challengeId: string, code: string): Promise<OtpVerifyResponse> {
  return requestAuthJson('/otp/verify', { challengeId, code });
}

export async function completeRegistration(payload: {
  registrationToken: string;
  firstName: string;
  lastName: string;
}): Promise<AuthResponse> {
  return requestAuth('/register/complete', payload);
}

export async function completePasswordLogin(passwordToken: string, password: string): Promise<AuthResponse> {
  return requestAuth('/login/password', { passwordToken, password });
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<AuthResponse> {
  return requestAuth('/password/reset', { resetToken, newPassword });
}

export async function requestNewMobile(changeToken: string, newPhone: string): Promise<OtpSendResponse> {
  return requestAuthJson('/mobile/change/request', { changeToken, newPhone });
}

export async function requestQuotation(
  accessToken: string,
  payload: {
    items: Array<{ productId: string; quantity: number; customizations?: Record<string, string> }>;
    notes?: string;
    projectCity?: string;
    contactPhone?: string;
    venueDetails?: string;
  },
): Promise<{ id: string; quotationNumber: string; totalAmount: number; status: string; validUntil?: string }> {
  const response = await fetch(`${getApiUrl()}/quotations/request`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'ارسال درخواست پیش‌فاکتور انجام نشد.'));
  }
  return response.json() as Promise<{
    id: string;
    quotationNumber: string;
    totalAmount: number;
    status: string;
    validUntil?: string;
  }>;
}

export async function fetchMyQuotations(accessToken: string): Promise<QuotationSummary[]> {
  const response = await fetch(`${getApiUrl()}/quotations/mine`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت پیش‌فاکتورها انجام نشد.');
  return response.json() as Promise<QuotationSummary[]>;
}

export async function acceptQuotation(accessToken: string, quotationId: string): Promise<QuotationSummary> {
  const response = await fetch(`${getApiUrl()}/quotations/${quotationId}/accept`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error('پذیرش پیش‌فاکتور انجام نشد.');
  return response.json() as Promise<QuotationSummary>;
}

export async function convertQuotation(accessToken: string, quotationId: string): Promise<{ orderNumber: string; totalAmount: number; status: string }> {
  const response = await fetch(`${getApiUrl()}/orders/from-quotation/${quotationId}`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error('تبدیل پیش‌فاکتور به سفارش انجام نشد.');
  return response.json() as Promise<{ orderNumber: string; totalAmount: number; status: string }>;
}

export async function fetchMyOrders(accessToken: string): Promise<OrderSummary[]> {
  const response = await fetch(`${getApiUrl()}/orders/mine`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت سفارش‌ها انجام نشد.');
  return response.json() as Promise<OrderSummary[]>;
}

export async function fetchMyOrder(accessToken: string, idOrNumber: string): Promise<OrderDetail> {
  const response = await fetch(`${getApiUrl()}/orders/mine/${encodeURIComponent(idOrNumber)}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('دریافت جزئیات سفارش انجام نشد.');
  return response.json() as Promise<OrderDetail>;
}

export async function fetchMyInvoices(accessToken: string): Promise<InvoiceSummary[]> {
  const response = await fetch(`${getApiUrl()}/invoices/mine`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت فاکتورها انجام نشد.');
  return response.json() as Promise<InvoiceSummary[]>;
}

export async function fetchMyInvoice(accessToken: string, idOrNumber: string): Promise<InvoiceSummary> {
  const response = await fetch(`${getApiUrl()}/invoices/mine/${encodeURIComponent(idOrNumber)}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('دریافت فاکتور انجام نشد.');
  return response.json() as Promise<InvoiceSummary>;
}

export async function fetchMyPayments(accessToken: string): Promise<PaymentAdminSummary[]> {
  const response = await fetch(`${getApiUrl()}/payments/mine`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'دریافت پرداخت‌ها انجام نشد.'));
  return response.json() as Promise<PaymentAdminSummary[]>;
}

export async function submitPayment(accessToken: string, invoiceId: string, amount: number): Promise<{ paymentStatus: string }> {
  const response = await fetch(`${getApiUrl()}/payments/${invoiceId}/pay`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ amount, paymentMethod: 'bank_transfer' }) });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'ثبت پرداخت انجام نشد.'));
  return response.json() as Promise<{ paymentStatus: string }>;
}

export async function submitTestPayment(
  accessToken: string,
  invoiceId: string,
): Promise<{ payment: { paymentStatus: string; transactionId: string | null }; invoice: InvoiceSummary }> {
  const response = await fetch(`${getApiUrl()}/payments/${invoiceId}/pay-test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'پرداخت آزمایشی انجام نشد.'));
  }
  return response.json() as Promise<{
    payment: { paymentStatus: string; transactionId: string | null };
    invoice: InvoiceSummary;
  }>;
}

export async function checkoutSpareParts(
  accessToken: string,
  payload: SparePartsCheckoutPayload,
): Promise<SparePartsCheckoutResult> {
  const response = await fetch(`${getApiUrl()}/orders/spare-parts/checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'ثبت سفارش قطعات انجام نشد.'));
  }
  return response.json() as Promise<SparePartsCheckoutResult>;
}

export async function fetchSpareParts(params?: {
  q?: string;
  category?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}): Promise<SparePart[]> {
  const body = await fetchSparePartsPage(params);
  return body.data;
}

export async function fetchSparePartsPage(params?: {
  q?: string; category?: string; inStock?: boolean; minPrice?: number; maxPrice?: number; page?: number; limit?: number;
}): Promise<AdminPage<SparePart>> {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.category) search.set('category', params.category);
  if (params?.inStock) search.set('inStock', '1');
  if (params?.minPrice != null) search.set('minPrice', String(params.minPrice));
  if (params?.maxPrice != null) search.set('maxPrice', String(params.maxPrice));
  search.set('page', String(params?.page ?? 1));
  search.set('limit', String(params?.limit ?? 20));
  const qs = search.toString();
  const response = await fetch(`${getApiUrl()}/spare-parts${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت قطعات یدکی انجام نشد.');
  const body = (await response.json()) as AdminPage<SparePart> | SparePart[];
  return Array.isArray(body) ? { data: body, meta: { page: 1, limit: body.length, total: body.length, totalPages: 1 } } : body;
}

export async function fetchSparePart(slugOrId: string): Promise<SparePart> {
  const response = await fetch(`${getApiUrl()}/spare-parts/${encodeURIComponent(slugOrId)}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('دریافت قطعه انجام نشد.');
  return response.json() as Promise<SparePart>;
}

export async function fetchServices(): Promise<ServiceSummary[]> {
  const response = await fetch(`${getApiUrl()}/services`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت خدمات انجام نشد.');
  return response.json() as Promise<ServiceSummary[]>;
}

export function fetchAdminSpareParts(accessToken: string): Promise<SparePart[]> {
  return fetchAdminSparePartsPage(accessToken, { page: 1, limit: 100 }).then((body) => body.data);
}
export function fetchAdminSparePartsPage(accessToken: string, params?: { page?: number; limit?: number; q?: string }): Promise<AdminPage<SparePart>> {
  const search = new URLSearchParams({ page: String(params?.page ?? 1), limit: String(params?.limit ?? 20) });
  if (params?.q) search.set('q', params.q);
  return adminRequest(accessToken, `/spare-parts/admin/all?${search}`);
}

export function fetchAdminSparePart(accessToken: string, id: string): Promise<SparePart> {
  return adminRequest(accessToken, `/spare-parts/admin/${id}`);
}

export type ManageSparePartPayload = {
  partNumber?: string;
  slug?: string;
  nameFa?: string;
  nameEn?: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  compatibleProducts?: string[];
  price?: number;
  priceNegotiable?: boolean;
  stockQuantity?: number;
  reorderLevel?: number;
  imageUrl?: string;
  gallery?: string[];
  brand?: string;
  oemCode?: string;
  weightGrams?: number;
  dimensions?: string;
  specs?: Array<{ key: string; value: string; unit?: string }>;
  warrantyMonths?: number;
  isActive?: boolean;
};

export function createAdminSparePart(
  accessToken: string,
  payload: Required<
    Pick<ManageSparePartPayload, 'partNumber' | 'nameFa' | 'nameEn' | 'description' | 'category' | 'price'>
  > &
    ManageSparePartPayload,
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
  payload: ManageSparePartPayload,
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
  const response = await fetch(`${getApiUrl()}/projects`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت پروژه‌ها انجام نشد.');
  return response.json() as Promise<OpsProject[]>;
}

export async function fetchPublishedProject(slug: string): Promise<OpsProject> {
  const response = await fetch(`${getApiUrl()}/projects/${slug}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت پروژه انجام نشد.');
  return response.json() as Promise<OpsProject>;
}

export async function fetchPortfolioWorks(): Promise<PortfolioWork[]> {
  const response = await fetch(`${getApiUrl()}/portfolio`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت نمونه‌کارها انجام نشد.');
  return response.json() as Promise<PortfolioWork[]>;
}

export async function fetchPortfolioWork(slug: string): Promise<PortfolioWork> {
  const response = await fetch(`${getApiUrl()}/portfolio/${slug}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت نمونه‌کار انجام نشد.');
  return response.json() as Promise<PortfolioWork>;
}

export async function createProduct(accessToken: string, payload: ManageProductPayload): Promise<Product> {
  const response = await fetch(`${getApiUrl()}/products`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'ایجاد محصول انجام نشد.'));
  return response.json() as Promise<Product>;
}

export async function updateProduct(accessToken: string, productId: string, payload: ManageProductPayload): Promise<Product> {
  const response = await fetch(`${getApiUrl()}/products/${productId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'ویرایش محصول انجام نشد.'));
  return response.json() as Promise<Product>;
}

export async function deleteProduct(accessToken: string, productId: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/products/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'حذف محصول انجام نشد.'));
}

export async function restoreProduct(accessToken: string, productId: string): Promise<Product> {
  const response = await fetch(`${getApiUrl()}/products/${productId}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'بازیابی محصول انجام نشد.'));
  return response.json() as Promise<Product>;
}

export async function purgeProduct(accessToken: string, productId: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/products/${productId}/purge`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'حذف دائم محصول انجام نشد.'));
}

export async function fetchAdminProducts(
  accessToken: string,
  status: 'active' | 'trash' | 'all' = 'active',
): Promise<Product[]> {
  const response = await fetch(`${getApiUrl()}/products/admin/all?status=${encodeURIComponent(status)}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'دریافت محصولات انجام نشد.'));
  const body = await response.json() as Product[] | { data: Product[] };
  return Array.isArray(body) ? body : body.data;
}

export async function fetchAdminProduct(accessToken: string, productId: string): Promise<Product> {
  const response = await fetch(`${getApiUrl()}/products/admin/${productId}`, {
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
  const response = await fetch(`${getApiUrl()}/products/admin/${productId}/specifications`, {
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
  const response = await fetch(`${getApiUrl()}/products/admin/${productId}/variants`, {
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
  const response = await fetch(`${getApiUrl()}/products/${productId}/specifications`, {
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
  const response = await fetch(`${getApiUrl()}/products/${productId}/specifications/${specId}`, {
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
  const response = await fetch(`${getApiUrl()}/products/${productId}/specifications/${specId}`, {
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
  const response = await fetch(`${getApiUrl()}/products/${productId}/specifications/reorder`, {
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
  const response = await fetch(`${getApiUrl()}/products/${productId}/copy-specs`, {
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
  const response = await fetch(`${getApiUrl()}/products/${productId}/variants`, {
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
  const response = await fetch(`${getApiUrl()}/products/${productId}/variants/${variantId}`, {
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
  const response = await fetch(`${getApiUrl()}/products/${productId}/variants/${variantId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'حذف مدل انجام نشد.'));
}

async function adminRequest<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, { ...init, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(init?.headers ?? {}) }, cache: 'no-store' });
  if (!response.ok) {
    const fallback = response.status === 401 ? 'نشست شما منقضی شده است. دوباره وارد شوید.' : response.status === 403 ? 'شما اجازهٔ انجام این عملیات را ندارید.' : response.status === 404 ? 'اطلاعات درخواستی پیدا نشد.' : response.status >= 500 ? 'خطای داخلی سامانه رخ داد. دوباره تلاش کنید.' : 'عملیات پنل مدیریت انجام نشد.';
    throw new Error(await readApiErrorMessage(response, fallback));
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function fetchAdminCustomers(accessToken: string, status: 'current' | 'deleted' = 'current'): Promise<CustomerAdminSummary[]> { return adminRequest(accessToken, `/customers/admin/all?status=${status}`); }
export function fetchAdminCustomersPage(accessToken: string, options: { status?: 'current' | 'deleted'; page?: number; limit?: number; search?: string } = {}): Promise<AdminListResponse<CustomerAdminSummary>> {
  return fetchAdminPage(accessToken, '/customers/admin/all', options);
}

export function updateCustomerStatus(accessToken: string, id: string, status: { isVerified: boolean; status: import('./customer-status').CustomerStatus; reason?: string }): Promise<CustomerAdminSummary> {
  return adminRequest(accessToken, `/customers/admin/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(status) });
}

export async function fetchAdminProductsPage(accessToken: string, options: { status?: 'active'|'trash'|'all'; page?: number; limit?: number; search?: string } = {}): Promise<ProductListResponse> {
  const params = new URLSearchParams({ status: options.status ?? 'active', page: String(options.page ?? 1), limit: String(options.limit ?? 20) });
  if (options.search?.trim()) params.set('search', options.search.trim());
  const response = await fetch(`${getApiUrl()}/products/admin/all?${params.toString()}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'دریافت محصولات انجام نشد.'));
  return response.json() as Promise<ProductListResponse>;
}
export function fetchAdminCustomer360(accessToken: string, id: string): Promise<Customer360> {
  return adminRequest(accessToken, `/customers/admin/${id}/360`);
}
export function updateCustomerVerified(accessToken: string, id: string, isVerified: boolean): Promise<CustomerAdminSummary> { return adminRequest(accessToken, `/customers/admin/${id}/verify`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isVerified }) }); }
export async function deleteAdminCustomer(accessToken: string, id: string): Promise<void> { await adminRequest(accessToken, `/customers/admin/${id}`, { method: 'DELETE' }); }
export async function permanentlyDeleteAdminCustomer(accessToken: string, id: string, confirmation: string): Promise<void> {
  await adminRequest(accessToken, `/customers/admin/${id}/permanent`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation }),
  });
}
export function fetchAdminQuotations(accessToken: string): Promise<QuotationAdminSummary[]> { return adminRequest(accessToken, '/quotations/admin/all'); }
export function fetchAdminOrders(accessToken: string): Promise<OrderAdminSummary[]> { return adminRequest(accessToken, '/orders/admin/all'); }
async function fetchAdminPage<T>(accessToken: string, path: string, options: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc'; status?: string } = {}): Promise<AdminListResponse<T>> {
  const params = new URLSearchParams({ page: String(options.page ?? 1), limit: String(options.limit ?? 20) });
  if (options.search?.trim()) params.set('search', options.search.trim());
  if (options.sort) params.set('sort', options.sort);
  if (options.order) params.set('order', options.order);
  if (options.status) params.set('status', options.status);
  const result = await adminRequest<T[] | AdminListResponse<T>>(accessToken, `${path}?${params.toString()}`);
  if (Array.isArray(result)) return { data: result, meta: { page: options.page ?? 1, limit: options.limit ?? 20, total: result.length, totalPages: Math.max(1, Math.ceil(result.length / (options.limit ?? 20))) } };
  return result;
}
export function fetchAdminOrdersPage(accessToken: string, options?: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc' }): Promise<AdminListResponse<OrderAdminSummary>> { return fetchAdminPage(accessToken, '/orders/admin/all', options); }
export function fetchAdminQuotationsPage(accessToken: string, options?: { page?: number; limit?: number; search?: string }): Promise<AdminListResponse<QuotationAdminSummary>> { return fetchAdminPage(accessToken, '/quotations/admin/all', options); }
export function fetchAdminOrder(accessToken: string, id: string): Promise<OrderDetail> {
  return adminRequest(accessToken, `/orders/admin/${id}`);
}
export function fetchAdminOrdersDetailed(accessToken: string): Promise<OrderDetail[]> {
  return adminRequest(accessToken, '/orders/admin/detailed');
}
export function updateQuotationStatus(accessToken: string, id: string, status: string): Promise<QuotationAdminSummary> { return adminRequest(accessToken, `/quotations/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); }
export function updateOrderStatus(accessToken: string, id: string, status: string): Promise<OrderAdminSummary> { return adminRequest(accessToken, `/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); }
export function fetchAdminProjects(accessToken: string): Promise<OpsProject[]> {
  return adminRequest(accessToken, '/projects/admin/all');
}
export function fetchAdminProjectsPage(accessToken: string, options: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc' } = {}): Promise<AdminListResponse<OpsProject>> { return fetchAdminPage(accessToken, '/projects/admin/all', options); }

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
export function fetchAdminPortfolioPage(accessToken: string, options: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc' } = {}): Promise<AdminListResponse<PortfolioWork>> { return fetchAdminPage(accessToken, '/portfolio/admin/all', options); }

export function fetchAdminPortfolioWork(accessToken: string, id: string): Promise<PortfolioWork> {
  return adminRequest(accessToken, `/portfolio/admin/${id}`);
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
export function fetchAdminInvoicesPage(accessToken: string, options?: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }): Promise<AdminListResponse<InvoiceAdminSummary>> { return fetchAdminPage(accessToken, '/invoices/admin/all', options); }
export function fetchAdminInvoice(accessToken: string, id: string): Promise<InvoiceSummary> {
  return adminRequest(accessToken, `/invoices/admin/${id}`);
}
export function updateInvoiceStatus(accessToken: string, id: string, status: string): Promise<InvoiceAdminSummary> { return adminRequest(accessToken, `/invoices/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); }
export function fetchAdminPayments(accessToken: string): Promise<PaymentAdminSummary[]> { return adminRequest(accessToken, '/payments/admin/all'); }
export function fetchAdminPaymentsPage(accessToken: string, options?: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }): Promise<AdminListResponse<PaymentAdminSummary>> { return fetchAdminPage(accessToken, '/payments/admin/all', options); }
export function updatePaymentStatus(accessToken: string, id: string, status: string): Promise<PaymentAdminSummary> { return adminRequest(accessToken, `/payments/admin/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); }
export function fetchAdminServices(accessToken: string): Promise<ServiceAdminSummary[]> {
  return adminRequest(accessToken, '/services/admin/all');
}
export function fetchAdminServicesPage(accessToken: string, options: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc' } = {}): Promise<AdminListResponse<ServiceAdminSummary>> { return fetchAdminPage(accessToken, '/services/admin/all', options); }

export function fetchAdminService(accessToken: string, id: string): Promise<ServiceAdminSummary> {
  return adminRequest(accessToken, `/services/admin/${id}`);
}

export function createAdminService(
  accessToken: string,
  payload: {
    nameFa: string;
    nameEn: string;
    description: string;
    serviceCategory: string;
    basePrice?: number | null;
    priceNegotiable?: boolean;
    unitType: string;
    coverImageUrl?: string;
    gallery?: string[];
    isActive?: boolean;
  },
): Promise<ServiceAdminSummary> {
  return adminRequest(accessToken, '/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateAdminService(
  accessToken: string,
  id: string,
  payload: Partial<{
    nameFa: string;
    nameEn: string;
    description: string;
    serviceCategory: string;
    basePrice: number | null;
    priceNegotiable: boolean;
    unitType: string;
    coverImageUrl: string;
    gallery: string[];
    isActive: boolean;
  }>,
): Promise<ServiceAdminSummary> {
  return adminRequest(accessToken, `/services/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
export function fetchAdminAttachments(accessToken: string): Promise<AttachmentAdminSummary[]> { return adminRequest(accessToken, '/attachments/admin/all'); }
export function fetchAdminAttachmentsPage(accessToken: string, options: { page?: number; limit?: number; search?: string } = {}): Promise<AdminListResponse<AttachmentAdminSummary>> { return fetchAdminPage(accessToken, '/attachments/admin/all', options); }
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
  const response = await fetch(`${getApiUrl()}/media/upload`, {
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
  const response = await fetch(`${getApiUrl()}/media/backup/download`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('دریافت بک‌آپ انجام نشد.');
  return response.blob();
}

export async function restoreMediaBackup(accessToken: string, file: File): Promise<{ restored: number; skipped: number }> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${getApiUrl()}/media/backup/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    body,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('بازیابی بک‌آپ انجام نشد.');
  return response.json() as Promise<{ restored: number; skipped: number }>;
}

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

export type BackupDatasetCount = {
  key: BackupDatasetKey;
  labelFa: string;
  groupFa: string;
  count: number;
  tableCounts: Record<string, number>;
  warningFa: string | null;
  includesFiles: boolean;
  dependsOn: BackupDatasetKey[];
};

export type BackupDatasetsResponse = {
  definitions: Array<{
    key: BackupDatasetKey;
    labelFa: string;
    descriptionFa: string;
    groupFa: string;
    dependsOn: BackupDatasetKey[];
    includesFiles: boolean;
    warningFa: string | null;
    tables: string[];
  }>;
  counts: BackupDatasetCount[];
};

export type BackupInspectResponse = {
  manifest: {
    format: string;
    version: number;
    createdAt: string;
    datasets: BackupDatasetKey[];
    counts: Record<string, number>;
    tableCounts: Record<string, number>;
    includeSoftDeleted: boolean;
    includeMediaFiles: boolean;
    notes?: string[];
  };
  availableDatasets: Array<{
    key: BackupDatasetKey;
    labelFa: string;
    groupFa: string;
    count: number;
    inFile: boolean;
    warningFa: string | null;
    includesFiles: boolean;
    dependsOn: BackupDatasetKey[];
  }>;
  tableCounts: Record<string, number>;
  datasetDetails: Array<{ key: BackupDatasetKey; tables: Array<{ name: string; rows: number }> }>;
};

export type BackupRestoreReport = {
  dryRun: boolean;
  mode: RestoreConflictMode;
  datasets: BackupDatasetKey[];
  tables: Array<{
    table: string;
    inserted: number;
    updated: number;
    skipped: number;
    cleared: number;
    errors: string[];
  }>;
  mediaFilesRestored: number;
  mediaFilesSkipped: number;
  warnings: string[];
};

export function fetchBackupDatasets(accessToken: string): Promise<BackupDatasetsResponse> {
  return adminRequest(accessToken, '/backup/datasets');
}

export async function downloadSystemBackup(
  accessToken: string,
  options: {
    datasets: BackupDatasetKey[] | ['all'];
    includeSoftDeleted?: boolean;
    includeMediaFiles?: boolean;
  },
): Promise<Blob> {
  const response = await fetch(`${getApiUrl()}/backup/export`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/zip',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'ساخت بک‌آپ انجام نشد.'));
  return response.blob();
}

export async function inspectSystemBackup(accessToken: string, file: File): Promise<BackupInspectResponse> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${getApiUrl()}/backup/inspect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    body,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'خواندن فایل بک‌آپ انجام نشد.'));
  return response.json() as Promise<BackupInspectResponse>;
}

export async function restoreSystemBackup(
  accessToken: string,
  file: File,
  options: {
    datasets?: BackupDatasetKey[];
    mode: RestoreConflictMode;
    dryRun?: boolean;
    restoreMediaFiles?: boolean;
    protectCurrentAdmin?: boolean;
  },
): Promise<BackupRestoreReport> {
  const body = new FormData();
  body.append('file', file);
  body.append('options', JSON.stringify(options));
  const response = await fetch(`${getApiUrl()}/backup/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    body,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response, 'بازیابی بک‌آپ انجام نشد.'));
  return response.json() as Promise<BackupRestoreReport>;
}

export function fetchAdminUsers(accessToken: string): Promise<UserAdminSummary[]> { return adminRequest(accessToken, '/users/admin/all'); }
export function fetchAdminUsersPage(accessToken: string, options: { page?: number; limit?: number; search?: string } = {}): Promise<AdminListResponse<UserAdminSummary>> { return fetchAdminPage(accessToken, '/users/admin/all', options); }
export function updateUserRole(accessToken: string, id: string, role: string): Promise<UserAdminSummary> { return adminRequest(accessToken, `/users/${id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) }); }
export function updateUserActive(accessToken: string, id: string, isActive: boolean): Promise<UserAdminSummary> { return adminRequest(accessToken, `/users/${id}/active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) }); }

async function requestAuth(path: string, body: object): Promise<AuthResponse> {
  const response = await fetch(`${getApiUrl()}/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'اطلاعات ورود یا ثبت‌نام صحیح نیست.'));
  }
  return response.json() as Promise<AuthResponse>;
}

async function requestAuthJson<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${getApiUrl()}/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'عملیات احراز هویت انجام نشد.'));
  }
  return response.json() as Promise<T>;
}
