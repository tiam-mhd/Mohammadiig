"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassButton } from "@/components/GlassButton";
import { ProductCard } from "@/components/ProductCard";
import {
  fetchCategories,
  fetchProducts,
  Product,
  ProductCategory,
} from "@/lib/api-client";

export function ProductsCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoading(true);
        setErrorMessage("");
      }
    });
    Promise.all([
      fetchProducts({
        category: selectedCategory || undefined,
        page,
        limit: 12,
      }),
      fetchCategories(),
    ])
      .then(([productResponse, categoryResponse]) => {
        if (!cancelled) {
          setProducts(productResponse.data ?? []);
          setCategories(categoryResponse);
          setPageMeta(productResponse.meta);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setProducts([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "دریافت محصولات انجام نشد.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, page]);

  useEffect(() => setPage(1), [selectedCategory]);

  const visibleProducts = useMemo(() => {
    return products;
  }, [products]);

  return (
    <div className="products-page">
      <div className="content-shell products-shell">
        <header className="products-head">
          <div className="products-head__copy">
            <p className="products-kicker">کاتالوگ</p>
            <h1 className="products-title">محصولات</h1>
            <p className="products-lede">
              دستگاه‌ها و قطعات موردنیاز سالن شهربازی — تصویر را ببینید، مشخصات
              را مقایسه کنید.
            </p>
          </div>
          <GlassButton href="/quote-request">درخواست قیمت</GlassButton>
        </header>

        <div
          className="products-toolbar"
          role="toolbar"
          aria-label="فیلتر محصولات"
        >
          <div className="products-chips">
            <button
              type="button"
              className={`products-chip${selectedCategory === "" ? " is-active" : ""}`}
              onClick={() => setSelectedCategory("")}
              aria-pressed={selectedCategory === ""}
            >
              همه
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`products-chip${selectedCategory === category.id ? " is-active" : ""}`}
                onClick={() => setSelectedCategory(category.id)}
                aria-pressed={selectedCategory === category.id}
              >
                {category.nameFa}
              </button>
            ))}
          </div>
          <p className="products-count" aria-live="polite">
            {isLoading
              ? "در حال بارگذاری..."
              : `${pageMeta.total.toLocaleString("fa-IR")} محصول`}
          </p>
        </div>

        {errorMessage ? (
          <div className="products-empty" role="alert">
            <p>{errorMessage}</p>
            <button
              type="button"
              className="products-empty__reset"
              onClick={() => setSelectedCategory("")}
            >
              تلاش دوباره
            </button>
          </div>
        ) : null}
        {!errorMessage && !isLoading && pageMeta.totalPages > 1 ? (
          <nav
            className="mt-8 flex items-center justify-between"
            aria-label="صفحه‌بندی محصولات"
          >
            <button
              type="button"
              className="products-empty__reset"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              قبلی
            </button>
            <span>
              صفحه {page.toLocaleString("fa-IR")} از{" "}
              {pageMeta.totalPages.toLocaleString("fa-IR")}
            </span>
            <button
              type="button"
              className="products-empty__reset"
              disabled={page >= pageMeta.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              بعدی
            </button>
          </nav>
        ) : null}

        {!errorMessage && !isLoading ? (
          <div className="products-grid">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                href={`/products/${product.slug}`}
              />
            ))}
          </div>
        ) : null}

        {!errorMessage && !isLoading && visibleProducts.length === 0 ? (
          <div className="products-empty">
            <p>محصولی در این دسته پیدا نشد.</p>
            <button
              type="button"
              className="products-empty__reset"
              onClick={() => setSelectedCategory("")}
            >
              نمایش همه
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
