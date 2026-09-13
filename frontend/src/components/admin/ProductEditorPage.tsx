'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
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
  isActive: false,
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

function suggestSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

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
    nameEn: product.nameEn || '',
    slug: product.slug,
    sku: product.sku || '',
    descriptionShortFa: product.description || '',
    descriptionLongFa: product.descriptionLong || '',
    category: matched,
    priceBase: product.price,
    images: product.images?.length ? product.images : product.image ? [product.image] : [],
    isActive: product.isActive ?? false,
    isFeatured: product.isFeatured,
  };
}

function Metabox({
  title,
  children,
  actions,
  className = '',
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-metabox ${className}`.trim()}>
      <header className="admin-metabox__head">
        <h2 className="admin-metabox__title">{title}</h2>
        {actions ? <div className="admin-metabox__actions">{actions}</div> : null}
      </header>
      <div className="admin-metabox__body">{children}</div>
    </section>
  );
}

export function ProductEditorPage({ productId }: { productId?: string }) {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const isNew = !productId;

  const [form, setForm] = useState(emptyForm);
  const [slugLocked, setSlugLocked] = useState(!isNew);
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

  const statusLabel = form.isActive ? 'منتشرشده' : 'پیش‌نویس';

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

        if (productId) {
          setLoading(true);
          const product = await fetchAdminProduct(accessToken!, productId);
          if (cancelled) return;
          setForm(productToForm(product, cats));
          setSlugLocked(true);
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

  function onTitleChange(value: string) {
    setForm((current) => {
      const next = { ...current, nameFa: value };
      if (!slugLocked) {
        next.slug = suggestSlug(value);
      }
      return next;
    });
  }

  async function persist(publishIntent?: boolean) {
    if (!accessToken) return;
    const nameFa = form.nameFa.trim();
    const slug = form.slug.trim();
    if (nameFa.length < 2) {
      adminToast.error('عنوان محصول الزامی است.');
      return;
    }
    if (slug.length < 2) {
      adminToast.error('آدرس محصول (slug) الزامی است.');
      return;
    }

    const isActive = publishIntent === undefined ? form.isActive : publishIntent;
    setSaving(true);
    try {
      const payload = {
        nameFa,
        slug,
        nameEn: form.nameEn.trim() || undefined,
        sku: form.sku.trim() || undefined,
        descriptionShortFa: form.descriptionShortFa.trim() || undefined,
        descriptionLongFa: form.descriptionLongFa.trim() || undefined,
        category: form.category || undefined,
        priceBase: Number.isFinite(form.priceBase) ? form.priceBase : 0,
        images: form.images,
        isActive,
        isFeatured: form.isFeatured,
      };
      if (isNew) {
        const created = await createProduct(accessToken, payload);
        adminToast.success(isActive ? 'محصول منتشر شد.' : 'پیش‌نویس ذخیره شد.');
        router.replace(`/admin/products/${created.id}`);
      } else {
        const updated = await updateProduct(accessToken, productId!, payload);
        setForm(productToForm(updated, categories));
        adminToast.success(isActive ? 'محصول منتشر و ذخیره شد.' : 'پیش‌نویس به‌روز شد.');
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
    const categoriesToCopy: ProductSpecCategory[] = [];
    if (copyTechnical) categoriesToCopy.push('technical');
    if (copyAppearance) categoriesToCopy.push('appearance');
    if (categoriesToCopy.length === 0) {
      adminToast.error('حداقل یک دسته را برای کپی انتخاب کنید.');
      return;
    }
    setCopying(true);
    try {
      const next = await copyProductSpecs(accessToken, productId, copySourceId, categoriesToCopy);
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
      variantNameEn: variantDraft.variantNameEn || variantDraft.variantNameFa,
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
      return <p className="admin-editor__hint">هنوز موردی ثبت نشده است.</p>;
    }
    return (
      <div className="admin-editor__spec-list">
        {items.map((spec) => (
          <div key={spec.id} className="admin-editor__spec-row">
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
            <div className="admin-editor__spec-actions">
              <button type="button" className="ops-btn ops-btn--ghost" onClick={() => void saveSpecification(spec)}>
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
      <div className="admin-editor__topbar">
        <Link href="/admin/products" className="ops-btn ops-btn--ghost">
          ← بازگشت به فهرست
        </Link>
        <div className="admin-editor__topbar-meta">
          <span className={`admin-badge ${form.isActive ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
            {statusLabel}
          </span>
          {!isNew && form.isActive ? (
            <Link href={`/products/${form.slug}`} className="ops-btn ops-btn--ghost" target="_blank">
              مشاهده در سایت
            </Link>
          ) : null}
        </div>
      </div>

      <div className="admin-editor">
        <div className="admin-editor__main">
          <div className="admin-editor__title-block">
            <label className="block text-start">
              <span className="sr-only">عنوان محصول</span>
              <input
                className="admin-editor__title-input"
                required
                minLength={2}
                maxLength={200}
                placeholder="عنوان محصول"
                value={form.nameFa}
                onChange={(event) => onTitleChange(event.target.value)}
              />
            </label>
            <div className="admin-editor__permalink">
              <span className="admin-editor__permalink-label">آدرس:</span>
              <span className="admin-editor__permalink-prefix" dir="ltr">
                /products/
              </span>
              <input
                className="admin-editor__permalink-input"
                required
                minLength={2}
                maxLength={200}
                dir="ltr"
                value={form.slug}
                onChange={(event) => {
                  setSlugLocked(true);
                  setForm({ ...form, slug: event.target.value });
                }}
              />
              {slugLocked && isNew ? (
                <button
                  type="button"
                  className="admin-editor__permalink-unlock"
                  onClick={() => setSlugLocked(false)}
                >
                  هم‌تراز با عنوان
                </button>
              ) : null}
            </div>
            <p className="admin-editor__hint">فقط عنوان و آدرس اجباری‌اند؛ بقیه فیلدها اختیاری‌اند.</p>
          </div>

          <Metabox title="توضیحات">
            <label className="block text-start">
              <span className="ops-login__label">خلاصه کوتاه</span>
              <input
                className="ops-field"
                maxLength={500}
                placeholder="یک جمله برای کارت محصول و نتایج جستجو"
                value={form.descriptionShortFa}
                onChange={(event) => setForm({ ...form, descriptionShortFa: event.target.value })}
              />
            </label>
            <label className="mt-4 block text-start">
              <span className="ops-login__label">توضیح کامل</span>
              <textarea
                className="ops-field admin-editor__body"
                maxLength={8000}
                value={form.descriptionLongFa}
                onChange={(event) => setForm({ ...form, descriptionLongFa: event.target.value })}
                placeholder="جزئیات کامل محصول، کاربرد، نکات نصب و بهره‌برداری…"
              />
            </label>
          </Metabox>

          <Metabox title="گالری تصاویر">
            <MediaField label="تصاویر محصول" multiple value={form.images} onChange={(images) => setForm({ ...form, images })} />
          </Metabox>

          {isNew ? (
            <Metabox title="مشخصات و مدل‌ها">
              <p className="admin-editor__hint">
                پس از ذخیرهٔ پیش‌نویس یا انتشار، بخش مشخصات فنی، ظاهری و مدل‌ها فعال می‌شود.
              </p>
            </Metabox>
          ) : (
            <>
              <Metabox title="مشخصات فنی">
                {renderSpecRows(technicalSpecs)}
                <div className="admin-editor__spec-row mt-4">
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
                  <div className="admin-editor__spec-actions">
                    <button
                      type="button"
                      className="ops-btn"
                      onClick={() => void addSpecification('technical', techDraft)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <IconPlus />
                        افزودن
                      </span>
                    </button>
                  </div>
                </div>
              </Metabox>

              <Metabox
                title="مشخصات ظاهری"
                actions={
                  <button type="button" className="ops-btn ops-btn--ghost" onClick={() => void ensureAppearanceDefaults()}>
                    افزودن پیش‌فرض‌ها
                  </button>
                }
              >
                {renderSpecRows(appearanceSpecs)}
                <div className="admin-editor__spec-row mt-4">
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
                  <div className="admin-editor__spec-actions">
                    <button
                      type="button"
                      className="ops-btn"
                      onClick={() => void addSpecification('appearance', appearanceDraft)}
                    >
                      افزودن
                    </button>
                  </div>
                </div>
              </Metabox>

              <Metabox title="کپی مشخصات از محصول دیگر">
                <p className="admin-editor__hint">
                  مشخصات دستهٔ انتخاب‌شده جایگزین موارد فعلی همان دسته می‌شود.
                </p>
                <div className="admin-form-grid two mt-3">
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
              </Metabox>

              <Metabox title="مدل‌ها / واریانت‌ها">
                {variants.length === 0 ? (
                  <p className="admin-editor__hint">مدلی ثبت نشده است.</p>
                ) : (
                  <div className="admin-editor__variant-list">
                    {variants.map((variant) => (
                      <div key={variant.id} className="admin-editor__variant-row">
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
              </Metabox>
            </>
          )}
        </div>

        <aside className="admin-editor__side">
          <Metabox title="انتشار" className="admin-metabox--sticky">
            <div className="admin-editor__publish-meta">
              <p>
                وضعیت:{' '}
                <strong className={form.isActive ? 'text-[var(--ops-ok)]' : 'text-[var(--ops-warn)]'}>
                  {statusLabel}
                </strong>
              </p>
              <label className="mt-3 block text-start">
                <span className="ops-login__label">تغییر وضعیت</span>
                <select
                  className="admin-select admin-select--wide"
                  value={form.isActive ? 'published' : 'draft'}
                  onChange={(event) => setForm({ ...form, isActive: event.target.value === 'published' })}
                >
                  <option value="draft">پیش‌نویس</option>
                  <option value="published">منتشرشده</option>
                </select>
              </label>
            </div>
            <div className="admin-editor__publish-actions">
              <button type="button" className="ops-btn ops-btn--ghost" disabled={saving} onClick={() => void persist(false)}>
                {saving ? '…' : 'ذخیره پیش‌نویس'}
              </button>
              <button
                type="button"
                className="ops-btn"
                disabled={saving}
                onClick={() => void persist(true)}
              >
                {saving ? 'در حال ذخیره…' : form.isActive || !isNew ? 'انتشار / به‌روزرسانی' : 'انتشار'}
              </button>
            </div>
            <p className="admin-editor__hint mt-3">
              پیش‌نویس در سایت عمومی دیده نمی‌شود. هر وقت آماده بودید، منتشر کنید.
            </p>
          </Metabox>

          <Metabox title="دسته‌بندی">
            <label className="block text-start">
              <span className="ops-login__label">دسته</span>
              <select
                className="admin-select admin-select--wide"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                <option value="">بدون دسته (اختیاری)</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </Metabox>

          <Metabox title="قیمت و کد کالا">
            <label className="block text-start">
              <span className="ops-login__label">قیمت پایه (ریال)</span>
              <input
                type="number"
                min={0}
                className="ops-field"
                dir="ltr"
                value={form.priceBase}
                onChange={(event) => setForm({ ...form, priceBase: Number(event.target.value) || 0 })}
              />
            </label>
            <label className="mt-3 block text-start">
              <span className="ops-login__label">کد کالا (SKU)</span>
              <input
                className="ops-field"
                dir="ltr"
                placeholder="خالی = ساخت خودکار از آدرس"
                value={form.sku}
                onChange={(event) => setForm({ ...form, sku: event.target.value })}
              />
            </label>
            <label className="mt-3 block text-start">
              <span className="ops-login__label">نام لاتین</span>
              <input
                className="ops-field"
                dir="ltr"
                placeholder="اختیاری"
                value={form.nameEn}
                onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
              />
            </label>
          </Metabox>

          <Metabox title="نمایش">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
              />
              محصول ویژه در صفحه اصلی
            </label>
          </Metabox>
        </aside>
      </div>

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
