'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Button, ProductCard } from '@/components';
import { createProduct, deleteProduct, fetchProducts, Product } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const initialForm = { nameFa: '', nameEn: '', slug: '', descriptionShortFa: '', sku: '', category: 'EQUIPMENT', priceBase: 0, thumbnailImageUrl: '' };

export default function AdminPage() {
  const { accessToken, user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  useEffect(() => { if (accessToken && (user?.role === 'admin' || user?.role === 'salesman')) fetchProducts().then((response) => setProducts(response.data)).catch(() => setMessage('دریافت محصولات انجام نشد.')); }, [accessToken, user?.role]);
  async function submit(event: FormEvent) { event.preventDefault(); if (!accessToken) return; try { const product = await createProduct(accessToken, form); setProducts([product, ...products]); setForm(initialForm); setMessage('محصول با موفقیت ایجاد شد.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'ایجاد محصول انجام نشد.'); } }
  async function remove(id: string) { if (!accessToken) return; try { await deleteProduct(accessToken, id); setProducts(products.filter((product) => product.id !== id)); setMessage('محصول حذف شد.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'حذف محصول انجام نشد.'); } }
  if (!accessToken || !['admin', 'salesman'].includes(user?.role ?? '')) return <main className="min-h-screen bg-neutral-50 px-5 py-32 text-center dark:bg-neutral-900"><span className="eyebrow">MIG ADMIN</span><h1 className="mt-5 text-4xl font-black dark:text-white">دسترسی محدود است</h1><Link href="/" className="mt-8 inline-block text-primary-500">بازگشت به سایت</Link></main>;
  return <main className="min-h-screen bg-neutral-50 px-5 py-20 dark:bg-neutral-900 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1300px]"><span className="eyebrow">MIG / OPERATIONS</span><h1 className="mt-4 text-5xl font-black dark:text-white">مدیریت محصولات</h1>{message && <p className="mt-6 border-r-2 border-primary-500 bg-primary-50 px-4 py-3 text-sm text-neutral-700">{message}</p>}<div className="mt-12 grid gap-12 lg:grid-cols-[340px_1fr]"><form onSubmit={submit} className="space-y-3 border border-neutral-200 bg-white p-6 dark:border-white/10 dark:bg-[#1b1d1b]"><h2 className="mb-5 text-xl font-black dark:text-white">محصول جدید</h2>{[['nameFa', 'نام فارسی'], ['nameEn', 'نام انگلیسی'], ['slug', 'slug'], ['sku', 'SKU'], ['category', 'دسته‌بندی'], ['descriptionShortFa', 'توضیح کوتاه'], ['thumbnailImageUrl', 'آدرس تصویر']].map(([key, label]) => <input key={key} required={key !== 'thumbnailImageUrl'} placeholder={label} value={form[key as keyof typeof form] as string} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="w-full border border-neutral-300 bg-transparent px-3 py-3 text-sm outline-none focus:border-primary-500 dark:border-white/20 dark:text-white" />)}<input required type="number" min="0" placeholder="قیمت پایه" value={form.priceBase} onChange={(event) => setForm({ ...form, priceBase: Number(event.target.value) })} className="w-full border border-neutral-300 bg-transparent px-3 py-3 text-sm outline-none focus:border-primary-500 dark:border-white/20 dark:text-white" /><Button type="submit" className="w-full rounded-none bg-primary-500 text-neutral-900">ایجاد محصول</Button></form><div className="grid gap-5 sm:grid-cols-2">{products.map((product) => <div key={product.id} className="relative"><ProductCard {...product} /><button type="button" onClick={() => remove(product.id)} className="absolute left-3 top-3 bg-red-600 px-3 py-2 text-xs font-bold text-white">حذف</button></div>)}</div></div></div></main>;
}
