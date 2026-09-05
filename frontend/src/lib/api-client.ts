const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: 'IRR';
  category: string;
  image: string | null;
  isFeatured: boolean;
}

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
export interface ServiceSummary { id: string; nameFa: string; description: string; serviceCategory: string; basePrice: number; unitType: string; }
export interface ProjectSummary { id: string; projectCode: string; projectName: string; description: string; status: string; city: string | null; startDate: string; expectedCompletionDate: string; budgetTotal: number; }
export interface ProductVariant { id: string; productId: string; skuVariant: string; variantNameFa: string; variantCode: string | null; priceBase: number | null; priceAdjustment: number; currency: string; stockQuantity: number; }
export interface ProductSpecification { id: string; productId: string; specificationKey: string; specificationValue: string; unit: string | null; specCategory: string; displayOrder: number; }
export interface SparePart { id: string; partNumber: string; nameFa: string; description: string; compatibleProducts: string[]; price: number; currency: string; stockQuantity: number; warrantyMonths: number; imageUrl: string | null; }
export interface ProjectPhaseSummary { id: string; phaseNumber: number; phaseNameFa: string; description: string; startDate: string; endDate: string; status: string; }

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
  const response = await fetch(`${API_URL}/invoices/${invoiceId}/pay`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ amount, paymentMethod: 'bank_transfer' }) });
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

export async function fetchMyProjects(accessToken: string): Promise<ProjectSummary[]> {
  const response = await fetch(`${API_URL}/projects/mine`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت پروژه‌ها انجام نشد.');
  return response.json() as Promise<ProjectSummary[]>;
}

export async function fetchProjectPhases(accessToken: string, projectId: string): Promise<ProjectPhaseSummary[]> {
  const response = await fetch(`${API_URL}/projects/${projectId}/phases`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('دریافت مراحل پروژه انجام نشد.');
  return response.json() as Promise<ProjectPhaseSummary[]>;
}

export async function createProduct(accessToken: string, payload: { nameFa: string; nameEn: string; slug: string; descriptionShortFa: string; sku: string; category: string; priceBase: number; thumbnailImageUrl?: string }): Promise<Product> {
  const response = await fetch(`${API_URL}/products`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('ایجاد محصول انجام نشد.');
  return response.json() as Promise<Product>;
}

export async function deleteProduct(accessToken: string, productId: string): Promise<void> {
  const response = await fetch(`${API_URL}/products/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error('حذف محصول انجام نشد.');
}

async function requestAuth(path: string, body: object): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error('اطلاعات ورود یا ثبت‌نام صحیح نیست.');
  return response.json() as Promise<AuthResponse>;
}
