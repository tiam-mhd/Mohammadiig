'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components';
import { createProduct, deleteProduct, fetchProducts, Product } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const initialForm = { nameFa: '', nameEn: '', slug: '', descriptionShortFa: '', sku: '', category: 'EQUIPMENT', priceBase: 0, thumbnailImageUrl: '' };

export function ProductManager() {
  const { accessToken } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { if (accessToken) fetchProducts().then((response) => setProducts(response.data)).catch(() => setMessage('دریافت محصولات انجام نشد.')); }, [accessToken]);

  async function submit(event: FormEvent) { event.preventDefault(); if (!accessToken) return; setIsSaving(true); setMessage(''); try { const product = await createProduct(accessToken, form); setProducts((current) => [product, ...current]); setForm(initialForm); setIsFormOpen(false); setMessage('محصول با موفقیت ایجاد شد.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'ایجاد محصول انجام نشد.'); } finally { setIsSaving(false); } }
  async function remove(id: string) { if (!accessToken) return; try { await deleteProduct(accessToken, id); setProducts((current) => current.filter((product) => product.id !== id)); setMessage('محصول حذف شد.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'حذف محصول انجام نشد.'); } }

  return <section><div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end dark:border-white/10"><div><span className="eyebrow">CATALOG / {products.length.toString().padStart(2, '0')} RECORDS</span><h2 className="mt-3 text-3xl font-black">مدیریت محصولات</h2></div><Button onClick={() => setIsFormOpen((current) => !current)} className="w-fit rounded-none bg-primary-500 text-neutral-950">{isFormOpen ? 'بستن فرم' : '＋ محصول جدید'}</Button></div>{message && <p className="mt-5 border-r-2 border-primary-500 bg-primary-50 px-4 py-3 text-sm text-neutral-700">{message}</p>}{isFormOpen && <form onSubmit={submit} className="mt-6 grid gap-3 border border-neutral-200 bg-white p-5 sm:grid-cols-2 dark:border-white/10 dark:bg-[#1b1d1b]"><h3 className="sm:col-span-2 text-xl font-black">ثبت محصول جدید</h3>{[['nameFa', 'نام فارسی'], ['nameEn', 'نام انگلیسی'], ['slug', 'Slug'], ['sku', 'SKU'], ['category', 'دسته‌بندی'], ['descriptionShortFa', 'توضیح کوتاه'], ['thumbnailImageUrl', 'آدرس تصویر']].map(([key, label]) => <input key={key} required={key !== 'thumbnailImageUrl'} placeholder={label} value={form[key as keyof typeof form] as string} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="w-full border border-neutral-300 bg-transparent px-3 py-3 text-sm outline-none focus:border-primary-500 dark:border-white/20" />)}<input required type="number" min="0" placeholder="قیمت پایه" value={form.priceBase} onChange={(event) => setForm({ ...form, priceBase: Number(event.target.value) })} className="w-full border border-neutral-300 bg-transparent px-3 py-3 text-sm outline-none focus:border-primary-500 dark:border-white/20" /><Button type="submit" isLoading={isSaving} className="rounded-none bg-neutral-900 text-white">ذخیره محصول</Button></form>}<div className="mt-8 overflow-hidden border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#1b1d1b]"><div className="hidden grid-cols-[1fr_150px_120px_90px] gap-4 border-b border-neutral-200 px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500 sm:grid dark:border-white/10"><span>محصول</span><span>دسته‌بندی</span><span>قیمت</span><span>عملیات</span></div>{products.map((product) => <div key={product.id} className="grid gap-3 border-b border-neutral-200 p-5 last:border-0 sm:grid-cols-[1fr_150px_120px_90px] sm:items-center sm:gap-4 dark:border-white/10"><div><strong className="block">{product.name}</strong><span className="mt-1 block text-xs text-neutral-500">{product.slug}</span></div><span className="text-xs text-neutral-500">{product.category}</span><span className="text-sm font-bold text-primary-600 dark:text-primary-500">{product.price.toLocaleString('fa-IR')} ریال</span><button type="button" onClick={() => remove(product.id)} className="w-fit bg-red-600 px-3 py-2 text-xs font-bold text-white">حذف</button></div>)}</div></section>;
}
