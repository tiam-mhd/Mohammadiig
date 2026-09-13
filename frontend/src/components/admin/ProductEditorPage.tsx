'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { IconAction, IconPlus, IconTrash } from '@/components/admin/AdminIcons';
import { MediaField } from '@/components/admin/MediaField';
import {
  Product,
  ProductCategory,
  ProductSpecCategory,
  ProductSpecification,
  ProductVariant,
  copyProductSpecs,
  createProduct,
  createProductSpecification,
  createProductVariant,
  deleteProductSpecification,
  deleteProductVariant,
  fetchAdminProduct,
  fetchAdminProductSpecifications,
  fetchAdminProductVariants,
  fetchAdminProducts,
  fetchCategories,
  updateProduct,
  updateProductSpecification,
  updateProductVariant,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const APPEARANCE_DEFAULTS = [
  { key: 'رنگ بدنه', unit: '' },
  { key: 'ابعاد', unit: 'سانتی‌متر' },
  { key: 'وزن تقریبی', unit: 'کیلوگرم' },
  { key: 'متریال بدنه', unit: '' },
  { key: 'ظرفیت / نفرات', unit: 'نفر' },
] as const;

type EditorForm = {
  nameFa: string;
  nameEn: string;
  slug: string;
  sku: string;
  descriptionShortFa: string;
  descriptionLongFa: string;
  category: string;
  priceBase: number;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
};

type SpecDraft = {
  specificationKey: string;
  specificationValue: string;
  unit: string;
};

type VariantDraft = {
  skuVariant: string;
  variantNameFa: string;
  variantNameEn: string;
  variantCode: string;
  priceBase: string;
  priceAdjustment: string;
  stockQuantity: string;
  isActive: boolean;
};

const emptyForm: EditorForm = {
  nameFa: '',
  nameEn: '',
  slug: '',
  sku: '',
  descriptionShortFa: '',
  descriptionLongFa: '',
  category: '',
  priceBase: 0,
  images: [],
  isActive: true,
  isFeatured: false,
};

const emptySpecDraft: SpecDraft = {
  specificationKey: '',
  specificationValue: '',
  unit: '',
};

const emptyVariantDraft: VariantDraft = {
  skuVariant: '',
  variantNameFa: '',
  variantNameEn: '',
  variantCode: '',
  priceBase: '',
  priceAdjustment: '0',
  stockQuantity: '0',
  isActive: true,
};

function productToForm(product: Product, categories: ProductCategory[]): EditorForm {
  const matched =
    categories.find(
      (category) =>
        category.id === product.category ||
        category.slug === product.category ||
        category.nameEn.toLowerCase() === product.category.toLowerCase(),
    )?.id ?? product.category;

  return {
    nameFa: product.name,
    nameEn: product.nameEn || product.name,
    slug: product.slug,
    sku: product.sku || '',
    descriptionShortFa: product.description,
    descriptionLongFa: product.descriptionLong || '',
    category: matched,
    priceBase: product.price,
    images: product.images?.length ? product.images : product.image ? [product.image] : [],
    isActive: product.isActive ?? true,
    isFeatured: product.isFeatured,
  };
}

export function ProductEditorPage({ productId }: { productId?: string }) {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const isNew = !productId;

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]);
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [techDraft, setTechDraft] = useState<SpecDraft>(emptySpecDraft);
  const [appearanceDraft, setAppearanceDraft] = useState<SpecDraft>(emptySpecDraft);
  const [variantDraft, setVariantDraft] = useState<VariantDraft>(emptyVariantDraft);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [copySourceId, setCopySourceId] = useState('');
  const [copyTechnical, setCopyTechnical] = useState(true);
  const [copyAppearance, setCopyAppearance] = useState(true);
  const [copying, setCopying] = useState(false);
  const [pendingDeleteSpec, setPendingDeleteSpec] = useState<ProductSpecification | null>(null);
  const [pendingDeleteVariant, setPendingDeleteVariant] = useState<ProductVariant | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.nameFa })),
    [categories],
  );

  const technicalSpecs = useMemo(
    () => specifications.filter((item) => item.specCategory === 'technical'),
    [specifications],
  );
  const appearanceSpecs = useMemo(
    () => specifications.filter((item) => item.specCategory === 'appearance'),
    [specifications],
  );

  const loadExtensions = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      const [specs, vars] = await Promise.all([
        fetchAdminProductSpecifications(accessToken, id),
        fetchAdminProductVariants(accessToken, id),
      ]);
      setSpecifications(specs);
      setVariants(vars);
    },
    [accessToken],
  );

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function boot() {
      try {
        const [cats, others] = await Promise.all([
          fetchCategories(),
          fetchAdminProducts(accessToken!, 'active'),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setSourceProducts(others.filter((item) => item.id !== productId));
        setForm((current) => ({
          ...current,
          category: current.category || cats[0]?.id || '',
        }));

        if (productId) {
          setLoading(true);
          const product = await fetchAdminProduct(accessToken!, productId);
          if (cancelled) return;
          setForm(productToForm(product, cats));
          await loadExtensions(productId);
        }
      } catch {
        if (!cancelled) adminToast.error('بارگذاری اطلاعات محصول انجام نشد.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [accessToken, productId, loadExtensions]);

  async function saveBasics(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    try {
      const payload = {
        nameFa: form.nameFa,
        nameEn: form.nameEn,
        slug: form.slug,
        sku: form.sku,
        descriptionShortFa: form.descriptionShortFa,
        descriptionLongFa: form.descriptionLongFa,
        category: form.category,
        priceBase: form.priceBase,
        images: form.images,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };
      if (isNew) {
        const created = await createProduct(accessToken, payload);
        adminToast.success('محصول ایجاد شد. حالا می‌توانید مشخصات را تکمیل کنید.');
        router.replace(`/admin/products/${created.id}`);
      } else {
        const updated = await updateProduct(accessToken, productId!, payload);
        setForm(productToForm(updated, categories));
        adminToast.success('اطلاعات پایه ذخیره شد.');
      }
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ذخیره محصول انجام نشد.');
    } finally {
      setSaving(false);
    }
  }

  async function addSpecification(category: ProductSpecCategory, draft: SpecDraft) {
    if (!accessToken || !productId) return;
    if (!draft.specificationKey.trim()) {
      adminToast.error('عنوان مشخصات الزامی است.');
      return;
    }
    try {
      const created = await createProductSpecification(accessToken, productId, {
        specificationKey: draft.specificationKey.trim(),
        specificationValue: draft.specificationValue.trim(),
        unit: draft.unit.trim() || null,
        specCategory: category,
      });
      setSpecifications((current) => [...current, created].sort((a, b) => a.displayOrder - b.displayOrder));
      if (category === 'technical') setTechDraft(emptySpecDraft);
      else setAppearanceDraft(emptySpecDraft);
      adminToast.success('مشخصات افزوده شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'افزودن مشخصات انجام نشد.');
    }
  }

  async function ensureAppearanceDefaults() {
    if (!accessToken || !productId) return;
    const existingKeys = new Set(appearanceSpecs.map((item) => item.specificationKey));
    const missing = APPEARANCE_DEFAULTS.filter((item) => !existingKeys.has(item.key));
    if (missing.length === 0) {
      adminToast.success('همه پیش‌فرض‌های ظاهری از قبل هستند.');
      return;
    }
    try {
      const created: ProductSpecification[] = [];
      for (const item of missing) {
        created.push(
          await createProductSpecification(accessToken, productId, {
            specificationKey: item.key,
            specificationValue: '',
            unit: item.unit || null,
            specCategory: 'appearance',
          }),
        );
      }
      setSpecifications((current) => [...current, ...created].sort((a, b) => a.displayOrder - b.displayOrder));
      adminToast.success(`${created.length.toLocaleString('fa-IR')} پیش‌فرض ظاهری اضافه شد.`);
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'افزودن پیش‌فرض‌ها انجام نشد.');
    }
  }

  async function saveSpecification(spec: ProductSpecification) {
    if (!accessToken || !productId) return;
    try {
      const updated = await updateProductSpecification(accessToken, productId, spec.id, {
        specificationKey: spec.specificationKey,
        specificationValue: spec.specificationValue,
        unit: spec.unit,
        specCategory: spec.specCategory as ProductSpecCategory,
        displayOrder: spec.displayOrder,
      });
      setSpecifications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      adminToast.success('مشخصات ذخیره شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ذخیره مشخصات انجام نشد.');
    }
  }

  async function confirmDeleteSpec() {
    if (!accessToken || !productId || !pendingDeleteSpec) return;
    setDeleting(true);
    try {
      await deleteProductSpecification(accessToken, productId, pendingDeleteSpec.id);
      setSpecifications((current) => current.filter((item) => item.id !== pendingDeleteSpec.id));
      setPendingDeleteSpec(null);
      adminToast.success('مشخصات حذف شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف مشخصات انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  async function runCopySpecs() {
    if (!accessToken || !productId || !copySourceId) return;
    const categories: ProductSpecCategory[] = [];
    if (copyTechnical) categories.push('technical');
    if (copyAppearance) categories.push('appearance');
    if (categories.length === 0) {
      adminToast.error('حداقل یک دسته را برای کپی انتخاب کنید.');
      return;
    }
    setCopying(true);
    try {
      const next = await copyProductSpecs(accessToken, productId, copySourceId, categories);
      setSpecifications(next);
      adminToast.success('مشخصات از محصول مبدأ منتقل شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'کپی مشخصات انجام نشد.');
    } finally {
      setCopying(false);
    }
  }

  async function saveVariant(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !productId) return;
    const payload = {
      skuVariant: variantDraft.skuVariant,
      variantNameFa: variantDraft.variantNameFa,
      variantNameEn: variantDraft.variantNameEn,
      variantCode: variantDraft.variantCode || null,
      priceBase: variantDraft.priceBase === '' ? null : Number(variantDraft.priceBase),
      priceAdjustment: Number(variantDraft.priceAdjustment || 0),
      stockQuantity: Number(variantDraft.stockQuantity || 0),
      isActive: variantDraft.isActive,
    };
    try {
      if (editingVariantId) {
        const updated = await updateProductVariant(accessToken, productId, editingVariantId, payload);
        setVariants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        adminToast.success('مدل ویرایش شد.');
      } else {
        const created = await createProductVariant(accessToken, productId, payload);
        setVariants((current) => [...current, created]);
        adminToast.success('مدل افزوده شد.');
      }
      setVariantDraft(emptyVariantDraft);
      setEditingVariantId(null);
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ذخیره مدل انجام نشد.');
    }
  }

  async function confirmDeleteVariant() {
    if (!accessToken || !productId || !pendingDeleteVariant) return;
    setDeleting(true);
    try {
      await deleteProductVariant(accessToken, productId, pendingDeleteVariant.id);
      setVariants((current) => current.filter((item) => item.id !== pendingDeleteVariant.id));
      setPendingDeleteVariant(null);
      adminToast.success('مدل حذف شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف مدل انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  function renderSpecRows(items: ProductSpecification[]) {
    if (items.length === 0) {
      return <p className="mt-3 text-sm text-[var(--ops-muted)]">هنوز موردی ثبت نشده است.</p>;
    }
    return (
      <div className="mt-4 space-y-3">
        {items.map((spec) => (
          <div key={spec.id} className="admin-form-grid two rounded-[var(--ops-radius)] border border-[var(--ops-line)] bg-[var(--ops-paper)] p-3">
            <label className="block text-start">
              <span className="ops-login__label">عنوان</span>
              <input
                className="ops-field"
                value={spec.specificationKey}
                onChange={(event) =>
                  setSpecifications((current) =>
                    current.map((item) =>
                      item.id === spec.id ? { ...item, specificationKey: event.target.value } : item,
                    ),
                  )
                }
              />
            </label>
            <label className="block text-start">
              <span className="ops-login__label">مقدار</span>
              <input
                className="ops-field"
                value={spec.specificationValue}
                onChange={(event) =>
                  setSpecifications((current) =>
                    current.map((item) =>
                      item.id === spec.id ? { ...item, specificationValue: event.target.value } : item,
                    ),
                  )
                }
              />
            </label>
            <label className="block text-start">
              <span className="ops-login__label">واحد</span>
              <input
                className="ops-field"
                value={spec.unit ?? ''}
                onChange={(event) =>
                  setSpecifications((current) =>
                    current.map((item) =>
                      item.id === spec.id ? { ...item, unit: event.target.value || null } : item,
                    ),
                  )
                }
              />
            </label>
            <div className="flex items-end gap-2">
              <button type="button" className="ops-btn" onClick={() => void saveSpecification(spec)}>
                ذخیره
              </button>
              <IconAction label="حذف" tone="danger" onClick={() => setPendingDeleteSpec(spec)}>
                <IconTrash />
              </IconAction>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!accessToken) {
    return (
      <AdminShell eyebrow="کاتالوگ" title="محصول">
        <p className="text-sm text-[var(--ops-muted)]">برای مدیریت محصول وارد شوید.</p>
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell eyebrow="کاتالوگ" title="محصول">
        <p className="text-sm text-[var(--ops-muted)]">در حال بارگذاری…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell eyebrow="کاتالوگ" title={isNew ? 'افزودن محصول' : 'ویرایش محصول'}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/products" className="ops-btn ops-btn--ghost">
          ← بازگشت به فهرست
        </Link>
        {!isNew ? (
          <Link href={`/products/${form.slug}`} className="ops-btn ops-btn--ghost" target="_blank">
            مشاهده در سایت
          </Link>
        ) : null}
      </div>

      <form onSubmit={saveBasics} className="space-y-5">
        <section className="admin-stat text-start">
          <p className="caption-up">اطلاعات پایه</p>
          <h2 className="display-sm mt-2">شناسه و قیمت</h2>
          <div className="admin-form-grid two mt-5">
            {(
              [
                ['nameFa', 'نام فارسی', 2],
                ['nameEn', 'نام لاتین', 2],
                ['slug', 'شناسه آدرس', 2],
                ['sku', 'کد کالا', 2],
              ] as const
            ).map(([key, label, minLength]) => (
              <label key={key} className="block text-start">
                <span className="ops-login__label">{label}</span>
                <input
                  required
                  minLength={minLength}
                  className="ops-field"
                  dir={key === 'nameFa' ? 'rtl' : 'ltr'}
                  value={form[key]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                />
              </label>
            ))}
            <label className="block text-start">
              <span className="ops-login__label">دسته‌بندی</span>
              <select
                required
                className="admin-select admin-select--wide"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {categoryOptions.length === 0 ? <option value="">دسته‌ای ثبت نشده</option> : null}
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-start">
              <span className="ops-login__label">قیمت پایه (ریال)</span>
              <input
                required
                type="number"
                min={0}
                className="ops-field"
                dir="ltr"
                value={form.priceBase}
                onChange={(event) => setForm({ ...form, priceBase: Number(event.target.value) })}
              />
            </label>
            <label className="block text-start sm:col-span-2">
              <span className="ops-login__label">توضیح کوتاه (حداقل ۱۰ کاراکتر)</span>
              <input
                required
                minLength={10}
                maxLength={500}
                className="ops-field"
                value={form.descriptionShortFa}
                onChange={(event) => setForm({ ...form, descriptionShortFa: event.target.value })}
              />
            </label>
            <label className="block text-start sm:col-span-2">
              <span className="ops-login__label">توضیح کامل</span>
              <textarea
                className="ops-field min-h-36"
                maxLength={8000}
                value={form.descriptionLongFa}
                onChange={(event) => setForm({ ...form, descriptionLongFa: event.target.value })}
                placeholder="جزئیات کامل محصول، کاربرد، نکات نصب و بهره‌برداری…"
              />
            </label>
            <div className="sm:col-span-2">
              <MediaField
                label="گالری تصاویر"
                multiple
                value={form.images}
                onChange={(images) => setForm({ ...form, images })}
              />
            </div>
            <label className="flex items-center gap-2 text-start text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              محصول فعال باشد
            </label>
            <label className="flex items-center gap-2 text-start text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
              />
              نمایش ویژه در سایت
            </label>
          </div>
          <div className="mt-5">
            <button type="submit" className="ops-btn" disabled={saving}>
              {saving ? 'در حال ذخیره…' : isNew ? 'ایجاد و ادامه' : 'ذخیره اطلاعات پایه'}
            </button>
          </div>
        </section>
      </form>

      {isNew ? (
        <section className="admin-stat mt-5 text-start">
          <p className="text-sm text-[var(--ops-muted)]">
            پس از ایجاد محصول، بخش‌های مشخصات فنی، ظاهری، کپی از محصول دیگر و مدل‌ها فعال می‌شوند.
          </p>
        </section>
      ) : (
        <>
          <section className="admin-stat mt-5 text-start">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="caption-up">مشخصات فنی</p>
                <h2 className="display-sm mt-2">ویژگی‌های فنی منعطف</h2>
              </div>
            </div>
            {renderSpecRows(technicalSpecs)}
            <div className="admin-form-grid two mt-4">
              <label className="block text-start">
                <span className="ops-login__label">عنوان</span>
                <input
                  className="ops-field"
                  value={techDraft.specificationKey}
                  onChange={(event) => setTechDraft({ ...techDraft, specificationKey: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">مقدار</span>
                <input
                  className="ops-field"
                  value={techDraft.specificationValue}
                  onChange={(event) => setTechDraft({ ...techDraft, specificationValue: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">واحد</span>
                <input
                  className="ops-field"
                  value={techDraft.unit}
                  onChange={(event) => setTechDraft({ ...techDraft, unit: event.target.value })}
                />
              </label>
              <div className="flex items-end">
                <button type="button" className="ops-btn" onClick={() => void addSpecification('technical', techDraft)}>
                  <span className="inline-flex items-center gap-2">
                    <IconPlus />
                    افزودن مشخصه فنی
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section className="admin-stat mt-5 text-start">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="caption-up">مشخصات ظاهری</p>
                <h2 className="display-sm mt-2">پیش‌فرض + موارد سفارشی</h2>
              </div>
              <button type="button" className="ops-btn ops-btn--ghost" onClick={() => void ensureAppearanceDefaults()}>
                افزودن پیش‌فرض‌ها
              </button>
            </div>
            {renderSpecRows(appearanceSpecs)}
            <div className="admin-form-grid two mt-4">
              <label className="block text-start">
                <span className="ops-login__label">عنوان</span>
                <input
                  className="ops-field"
                  value={appearanceDraft.specificationKey}
                  onChange={(event) =>
                    setAppearanceDraft({ ...appearanceDraft, specificationKey: event.target.value })
                  }
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">مقدار</span>
                <input
                  className="ops-field"
                  value={appearanceDraft.specificationValue}
                  onChange={(event) =>
                    setAppearanceDraft({ ...appearanceDraft, specificationValue: event.target.value })
                  }
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">واحد</span>
                <input
                  className="ops-field"
                  value={appearanceDraft.unit}
                  onChange={(event) => setAppearanceDraft({ ...appearanceDraft, unit: event.target.value })}
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  className="ops-btn"
                  onClick={() => void addSpecification('appearance', appearanceDraft)}
                >
                  افزودن مشخصه ظاهری
                </button>
              </div>
            </div>
          </section>

          <section className="admin-stat mt-5 text-start">
            <p className="caption-up">نقل مشخصات</p>
            <h2 className="display-sm mt-2">کپی از محصول دیگر</h2>
            <p className="mt-2 text-sm text-[var(--ops-muted)]">
              مشخصات دستهٔ انتخاب‌شده جایگزین موارد فعلی همان دسته می‌شود.
            </p>
            <div className="admin-form-grid two mt-4">
              <label className="block text-start">
                <span className="ops-login__label">محصول مبدأ</span>
                <select
                  className="admin-select admin-select--wide"
                  value={copySourceId}
                  onChange={(event) => setCopySourceId(event.target.value)}
                >
                  <option value="">انتخاب کنید</option>
                  {sourceProducts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col justify-end gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={copyTechnical}
                    onChange={(event) => setCopyTechnical(event.target.checked)}
                  />
                  مشخصات فنی
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={copyAppearance}
                    onChange={(event) => setCopyAppearance(event.target.checked)}
                  />
                  مشخصات ظاهری
                </label>
              </div>
            </div>
            <button
              type="button"
              className="ops-btn mt-4"
              disabled={copying || !copySourceId}
              onClick={() => void runCopySpecs()}
            >
              {copying ? 'در حال کپی…' : 'انتقال مشخصات'}
            </button>
          </section>

          <section className="admin-stat mt-5 text-start">
            <p className="caption-up">مدل‌ها</p>
            <h2 className="display-sm mt-2">واریانت‌های قابل سفارش</h2>
            {variants.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ops-muted)]">مدلی ثبت نشده است.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--ops-radius)] border border-[var(--ops-line)] bg-[var(--ops-paper)] px-3 py-3"
                  >
                    <div className="text-start">
                      <strong className="block">{variant.variantNameFa}</strong>
                      <span className="text-xs text-[var(--ops-muted)]" dir="ltr">
                        {variant.skuVariant}
                        {variant.variantCode ? ` · ${variant.variantCode}` : ''}
                        {' · '}
                        موجودی {variant.stockQuantity.toLocaleString('fa-IR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="ops-btn ops-btn--ghost"
                        onClick={() => {
                          setEditingVariantId(variant.id);
                          setVariantDraft({
                            skuVariant: variant.skuVariant,
                            variantNameFa: variant.variantNameFa,
                            variantNameEn: variant.variantNameEn || variant.variantNameFa,
                            variantCode: variant.variantCode || '',
                            priceBase: variant.priceBase == null ? '' : String(variant.priceBase),
                            priceAdjustment: String(variant.priceAdjustment ?? 0),
                            stockQuantity: String(variant.stockQuantity ?? 0),
                            isActive: variant.isActive ?? true,
                          });
                        }}
                      >
                        ویرایش
                      </button>
                      <IconAction label="حذف" tone="danger" onClick={() => setPendingDeleteVariant(variant)}>
                        <IconTrash />
                      </IconAction>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={saveVariant} className="admin-form-grid two mt-4">
              <label className="block text-start">
                <span className="ops-login__label">کد مدل (SKU)</span>
                <input
                  required
                  className="ops-field"
                  dir="ltr"
                  value={variantDraft.skuVariant}
                  onChange={(event) => setVariantDraft({ ...variantDraft, skuVariant: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">کد نمایشی</span>
                <input
                  className="ops-field"
                  dir="ltr"
                  value={variantDraft.variantCode}
                  onChange={(event) => setVariantDraft({ ...variantDraft, variantCode: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">نام فارسی</span>
                <input
                  required
                  className="ops-field"
                  value={variantDraft.variantNameFa}
                  onChange={(event) => setVariantDraft({ ...variantDraft, variantNameFa: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">نام لاتین</span>
                <input
                  required
                  className="ops-field"
                  dir="ltr"
                  value={variantDraft.variantNameEn}
                  onChange={(event) => setVariantDraft({ ...variantDraft, variantNameEn: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">قیمت پایه</span>
                <input
                  type="number"
                  min={0}
                  className="ops-field"
                  dir="ltr"
                  value={variantDraft.priceBase}
                  onChange={(event) => setVariantDraft({ ...variantDraft, priceBase: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">تعدیل قیمت</span>
                <input
                  type="number"
                  className="ops-field"
                  dir="ltr"
                  value={variantDraft.priceAdjustment}
                  onChange={(event) => setVariantDraft({ ...variantDraft, priceAdjustment: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">موجودی</span>
                <input
                  type="number"
                  min={0}
                  className="ops-field"
                  dir="ltr"
                  value={variantDraft.stockQuantity}
                  onChange={(event) => setVariantDraft({ ...variantDraft, stockQuantity: event.target.value })}
                />
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={variantDraft.isActive}
                  onChange={(event) => setVariantDraft({ ...variantDraft, isActive: event.target.checked })}
                />
                مدل فعال باشد
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button type="submit" className="ops-btn">
                  {editingVariantId ? 'ذخیره مدل' : 'افزودن مدل'}
                </button>
                {editingVariantId ? (
                  <button
                    type="button"
                    className="ops-btn ops-btn--ghost"
                    onClick={() => {
                      setEditingVariantId(null);
                      setVariantDraft(emptyVariantDraft);
                    }}
                  >
                    انصراف ویرایش
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </>
      )}

      <AdminConfirmModal
        open={Boolean(pendingDeleteSpec)}
        description={`مشخصه «${pendingDeleteSpec?.specificationKey ?? ''}» حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDeleteSpec(null)}
        onConfirm={confirmDeleteSpec}
      />
      <AdminConfirmModal
        open={Boolean(pendingDeleteVariant)}
        description={`مدل «${pendingDeleteVariant?.variantNameFa ?? ''}» حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDeleteVariant(null)}
        onConfirm={confirmDeleteVariant}
      />
    </AdminShell>
  );
}
