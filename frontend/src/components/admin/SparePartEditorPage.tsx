'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { MediaField } from '@/components/admin/MediaField';
import { PriceField } from '@/components/admin/PriceField';
import {
  createAdminSparePart,
  fetchAdminSparePart,
  fetchAdminSparePartCategories,
  SparePart,
  SparePartCategory,
  updateAdminSparePart,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

type EditorForm = {
  partNumber: string;
  nameFa: string;
  nameEn: string;
  description: string;
  category: string;
  compatibleProductsText: string;
  price: string;
  priceNegotiable: boolean;
  stockQuantity: string;
  reorderLevel: string;
  imageUrl: string;
  warrantyMonths: string;
  isActive: boolean;
};

const emptyForm: EditorForm = {
  partNumber: '',
  nameFa: '',
  nameEn: '',
  description: '',
  category: '',
  compatibleProductsText: '',
  price: '0',
  priceNegotiable: false,
  stockQuantity: '0',
  reorderLevel: '5',
  imageUrl: '',
  warrantyMonths: '12',
  isActive: false,
};

function parseCompatibleIds(value: string) {
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function partToForm(part: SparePart): EditorForm {
  return {
    partNumber: part.partNumber,
    nameFa: part.nameFa,
    nameEn: part.nameEn ?? '',
    description: part.description,
    category: part.category,
    compatibleProductsText: (part.compatibleProducts ?? []).join(', '),
    price: String(part.price ?? 0),
    priceNegotiable: Boolean(part.priceNegotiable),
    stockQuantity: String(part.stockQuantity ?? 0),
    reorderLevel: String(part.reorderLevel ?? 5),
    imageUrl: part.imageUrl ?? '',
    warrantyMonths: String(part.warrantyMonths ?? 12),
    isActive: part.isActive ?? true,
  };
}

function Metabox({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-metabox ${className}`.trim()}>
      <header className="admin-metabox__head">
        <h2 className="admin-metabox__title">{title}</h2>
      </header>
      <div className="admin-metabox__body">{children}</div>
    </section>
  );
}

export function SparePartEditorPage({ partId }: { partId?: string }) {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const isNew = !partId;

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<SparePartCategory[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.nameFa })),
    [categories],
  );

  const statusLabel = form.isActive ? 'فعال' : 'پیش‌نویس';
  const stockNum = Number(form.stockQuantity || 0);
  const reorderNum = Number(form.reorderLevel || 0);
  const lowStock = stockNum <= reorderNum;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function boot() {
      try {
        const cats = await fetchAdminSparePartCategories(accessToken!);
        if (cancelled) return;
        setCategories(cats);

        if (partId) {
          setLoading(true);
          const part = await fetchAdminSparePart(accessToken!, partId);
          if (cancelled) return;
          const next = partToForm(part);
          if (!next.category && cats[0]) next.category = cats[0].id;
          setForm(next);
        } else if (cats[0]) {
          setForm((current) => ({ ...current, category: current.category || cats[0].id }));
        }
      } catch {
        if (!cancelled) adminToast.error('بارگذاری اطلاعات قطعه انجام نشد.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [accessToken, partId]);

  async function persist(publishIntent?: boolean) {
    if (!accessToken) return;
    const nameFa = form.nameFa.trim();
    const nameEn = form.nameEn.trim();
    const partNumber = form.partNumber.trim();
    const description = form.description.trim();
    const category = form.category.trim();

    if (partNumber.length < 2) {
      adminToast.error('شماره قطعه الزامی است.');
      return;
    }
    if (nameFa.length < 2) {
      adminToast.error('نام فارسی الزامی است.');
      return;
    }
    if (nameEn.length < 2) {
      adminToast.error('نام لاتین الزامی است.');
      return;
    }
    if (description.length < 2) {
      adminToast.error('توضیح الزامی است.');
      return;
    }
    if (!category) {
      adminToast.error('دسته‌بندی الزامی است.');
      return;
    }

    const isActive = publishIntent === undefined ? form.isActive : publishIntent;
    setSaving(true);
    try {
      const payload = {
        partNumber,
        nameFa,
        nameEn,
        description,
        category,
        compatibleProducts: parseCompatibleIds(form.compatibleProductsText),
        price: form.priceNegotiable ? Number(form.price || 0) : Number(form.price || 0),
        priceNegotiable: form.priceNegotiable,
        stockQuantity: Number(form.stockQuantity || 0),
        reorderLevel: Number(form.reorderLevel || 0),
        imageUrl: form.imageUrl || undefined,
        warrantyMonths: Number(form.warrantyMonths || 0),
        isActive,
      };
      if (isNew) {
        const created = await createAdminSparePart(accessToken, payload);
        adminToast.success(isActive ? 'قطعه منتشر شد.' : 'پیش‌نویس ذخیره شد.');
        router.replace(`/admin/spare-parts/${created.id}`);
      } else {
        const updated = await updateAdminSparePart(accessToken, partId!, payload);
        setForm(partToForm(updated));
        adminToast.success(isActive ? 'قطعه منتشر و ذخیره شد.' : 'پیش‌نویس به‌روز شد.');
      }
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ذخیره قطعه انجام نشد.');
    } finally {
      setSaving(false);
    }
  }

  if (!accessToken) {
    return (
      <AdminShell eyebrow="پس از فروش" title="قطعه یدکی">
        <p className="text-sm text-[var(--ops-muted)]">برای مدیریت قطعه وارد شوید.</p>
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell eyebrow="پس از فروش" title="قطعه یدکی">
        <p className="text-sm text-[var(--ops-muted)]">در حال بارگذاری…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell eyebrow="پس از فروش" title={isNew ? 'افزودن قطعه' : 'ویرایش قطعه'}>
      <div className="admin-editor__topbar">
        <Link href="/admin/spare-parts" className="ops-btn ops-btn--ghost">
          ← بازگشت به فهرست
        </Link>
        <div className="admin-editor__topbar-meta">
          <span className={`admin-badge ${form.isActive ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
            {statusLabel}
          </span>
          {lowStock ? <span className="admin-badge admin-badge--warn">موجودی کم</span> : null}
        </div>
      </div>

      <div className="admin-editor">
        <div className="admin-editor__main">
          <div className="admin-editor__title-block">
            <label className="block text-start">
              <span className="sr-only">نام قطعه</span>
              <input
                className="admin-editor__title-input"
                required
                minLength={2}
                maxLength={150}
                placeholder="نام قطعه"
                value={form.nameFa}
                onChange={(event) => setForm({ ...form, nameFa: event.target.value })}
              />
            </label>
            <div className="admin-editor__permalink">
              <span className="admin-editor__permalink-label">شماره:</span>
              <input
                className="admin-editor__permalink-input"
                required
                minLength={2}
                maxLength={50}
                dir="ltr"
                placeholder="MIG-SP-…"
                value={form.partNumber}
                onChange={(event) => setForm({ ...form, partNumber: event.target.value })}
              />
            </div>
          </div>

          <Metabox title="توضیحات">
            <label className="block text-start">
              <span className="ops-login__label">نام لاتین</span>
              <input
                className="ops-field"
                dir="ltr"
                value={form.nameEn}
                onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
              />
            </label>
            <label className="mt-4 block text-start">
              <span className="ops-login__label">توضیح</span>
              <textarea
                className="ops-field admin-editor__body"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="کاربرد، سازگاری و نکات فنی قطعه…"
              />
            </label>
            <label className="mt-4 block text-start">
              <span className="ops-login__label">شناسه محصولات سازگار</span>
              <input
                className="ops-field"
                dir="ltr"
                placeholder="مثلاً id1, id2"
                value={form.compatibleProductsText}
                onChange={(event) => setForm({ ...form, compatibleProductsText: event.target.value })}
              />
            </label>
          </Metabox>

          <Metabox title="رسانه">
            <MediaField
              label="تصویر قطعه"
              value={form.imageUrl}
              onChange={(imageUrl) => setForm({ ...form, imageUrl })}
            />
          </Metabox>

          <Metabox title="ردیابی موجودی">
            <div className="admin-form-grid two">
              <label className="block text-start">
                <span className="ops-login__label">موجودی فعلی</span>
                <input
                  type="number"
                  min={0}
                  className="ops-field"
                  dir="ltr"
                  value={form.stockQuantity}
                  onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">حد سفارش مجدد</span>
                <input
                  type="number"
                  min={0}
                  className="ops-field"
                  dir="ltr"
                  value={form.reorderLevel}
                  onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })}
                />
              </label>
            </div>
            <p className={`admin-editor__hint mt-3 ${lowStock ? 'text-[var(--ops-warn)]' : ''}`}>
              {lowStock
                ? 'موجودی به حد سفارش مجدد رسیده یا پایین‌تر است.'
                : 'وقتی موجودی به حد سفارش مجدد برسد، در فهرست هشدار داده می‌شود.'}
            </p>
          </Metabox>
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
                  <option value="published">فعال / منتشرشده</option>
                </select>
              </label>
            </div>
            <div className="admin-editor__publish-actions">
              <button type="button" className="ops-btn ops-btn--ghost" disabled={saving} onClick={() => void persist(false)}>
                {saving ? '…' : 'ذخیره پیش‌نویس'}
              </button>
              <button type="button" className="ops-btn" disabled={saving} onClick={() => void persist(true)}>
                {saving ? 'در حال ذخیره…' : form.isActive || !isNew ? 'انتشار / به‌روزرسانی' : 'انتشار'}
              </button>
            </div>
          </Metabox>

          <Metabox title="دسته‌بندی">
            <label className="block text-start">
              <span className="ops-login__label">دسته</span>
              <select
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
            <label className="mt-3 block text-start">
              <span className="ops-login__label">گارانتی (ماه)</span>
              <input
                type="number"
                min={0}
                className="ops-field"
                dir="ltr"
                value={form.warrantyMonths}
                onChange={(event) => setForm({ ...form, warrantyMonths: event.target.value })}
              />
            </label>
          </Metabox>

          <Metabox title="قیمت">
            <PriceField
              label="قیمت (ریال)"
              value={form.price}
              negotiable={form.priceNegotiable}
              onValueChange={(price) => setForm({ ...form, price })}
              onNegotiableChange={(priceNegotiable) => setForm({ ...form, priceNegotiable })}
            />
          </Metabox>
        </aside>
      </div>
    </AdminShell>
  );
}
