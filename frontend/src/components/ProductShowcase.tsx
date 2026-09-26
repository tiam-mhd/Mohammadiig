"use client";

import { useEffect, useState } from "react";
import { fetchProducts, Product } from "@/lib/api-client";
import { ProductCard } from "./ProductCard";

export function ProductShowcase() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsLoading(true);
        setErrorMessage("");
      }
    });
    fetchProducts()
      .then((response) => {
        if (isMounted) {
          setProducts(response.data ?? []);
        }
      })
      .catch((error) => {
        if (isMounted)
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "دریافت محصولات انجام نشد.",
          );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <p className="caption-up mb-10">
        <span
          className={`ml-2 inline-block h-1.5 w-1.5 rounded-full ${
            errorMessage ? "bg-muted" : "bg-success"
          }`}
        />
        {isLoading
          ? "در حال دریافت محصولات"
          : errorMessage
            ? "خطا در دریافت محصولات"
            : "کاتالوگ زنده"}
      </p>
      {errorMessage ? (
        <p className="font-ui text-sm text-muted">{errorMessage}</p>
      ) : null}
      {!isLoading && !errorMessage && products.length === 0 ? (
        <p className="font-ui text-sm text-muted">
          در حال حاضر محصولی برای نمایش وجود ندارد.
        </p>
      ) : null}
      {!errorMessage ? (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-x-10 md:gap-y-16">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={index === 0 ? "md:col-span-2" : ""}
            >
              <ProductCard {...product} slug={product.slug} />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
