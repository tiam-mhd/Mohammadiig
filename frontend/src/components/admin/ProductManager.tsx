'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import { createProduct, deleteProduct, fetchProducts, Product } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const initialForm = {
  nameFa: '',
  nameEn: '',
  slug: '',
  descriptionShortFa: '',
  sku: '',
  category: 'EQUIPMENT',
  priceBase: 0,
  thumbnailImageUrl: '',
};

const fields: Array<[keyof typeof initialForm, string]> = [
  ['nameFa', 'نام فارسی'],
  ['nameEn', 'نام انگلیسی'],
  ['slug', 'Slug'],
  ['sku', 'SKU'],
  ['category', 'دسته‌بندی'],
  ['descriptionShortFa', 'توضیح کوتاه'],
  ['thumbnailImageUrl', 'آدرس تصویر'],
];

export function ProductManager() {
  const { accessToken } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    fetchProducts()
      .then((response) => setProducts(response.data))
      .catch(() => setMessage('دریافت محصولات انجام نشد.'));
  }, [accessToken]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    setMessage('');
    try {
      const product = await createProduct(accessToken, form);
      setProducts((current) => [product, ...current]);
      setForm(initialForm);
      setIsFormOpen(false);
      setMessage('محصول با موفقیت ایجاد شد.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ایجاد محصول انجام نشد.');
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    if (!accessToken) return;
    try {
      await deleteProduct(accessToken, id);
      setProducts((current) => current.filter((product) => product.id !== id));
      setMessage('محصول حذف شد.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'حذف محصول انجام نشد.');
    }
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end">
        <div className="text-start">
          <p className="caption-up">
            کاتالوگ · {products.length.toLocaleString('fa-IR')} مورد
          </p>
          <h2 className="display-sm mt-3 text-ink">مدیریت محصولات</h2>
        </div>
        <Button onClick={() => setIsFormOpen((current) => !current)} className="w-fit">
          {isFormOpen ? 'بستن فرم' : 'محصول جدید'}
        </Button>
      </div>

      {message ? <p className="field-message mt-5">{message}</p> : null}

      {isFormOpen ? (
        <form
          onSubmit={submit}
          className="mt-8 grid gap-5 border-y border-hairline py-8 sm:grid-cols-2"
        >
          <h3 className="display-sm sm:col-span-2 text-ink">ثبت محصول جدید</h3>
          {fields.map(([key, label]) => (
            <label key={key} className="block text-start">
              <span className="caption-up">{label}</span>
              <input
                required={key !== 'thumbnailImageUrl'}
                value={String(form[key])}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                className="field-input mt-2"
                dir={key === 'nameFa' || key === 'descriptionShortFa' || key === 'category' ? 'rtl' : 'ltr'}
              />
            </label>
          ))}
          <label className="block text-start">
            <span className="caption-up">قیمت پایه</span>
            <input
              required
              type="number"
              min={0}
              value={form.priceBase}
              onChange={(event) => setForm({ ...form, priceBase: Number(event.target.value) })}
              className="field-input mt-2"
              dir="ltr"
            />
          </label>
          <div className="flex items-end sm:col-span-2">
            <Button type="submit" isLoading={isSaving}>
              ذخیره محصول
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-8">
        <DataTable
          headers={['محصول', 'دسته‌بندی', 'قیمت', 'عملیات']}
          columns="sm:grid-cols-[1fr_150px_140px_100px]"
        >
          {products.map((product) => (
            <DataRow
              key={product.id}
              columns="sm:grid-cols-[1fr_150px_140px_100px]"
              className="text-start"
            >
              <div>
                <strong className="block font-normal text-ink">{product.name}</strong>
                <span className="mt-1 block text-xs text-muted">{product.slug}</span>
              </div>
              <span className="text-muted">{product.category}</span>
              <span className="text-ink">{product.price.toLocaleString('fa-IR')} ریال</span>
              <button
                type="button"
                onClick={() => remove(product.id)}
                className="admin-action admin-action--danger w-fit"
              >
                حذف
              </button>
            </DataRow>
          ))}
          {products.length === 0 ? (
            <p className="py-14 text-center font-ui text-sm text-muted">محصولی ثبت نشده است.</p>
          ) : null}
        </DataTable>
      </div>
    </section>
  );
}
