"use client";

import { useMemo, useState } from "react";
import { resolveMediaUrl } from "@/lib/media";

type SparePartGalleryProps = {
  nameFa: string;
  imageUrl?: string | null;
  gallery?: string[];
};

export function SparePartGallery({
  nameFa,
  imageUrl,
  gallery = [],
}: SparePartGalleryProps) {
  const images = useMemo(() => {
    const list = [imageUrl, ...gallery]
      .map((url) => resolveMediaUrl(url))
      .filter((url): url is string => Boolean(url));
    return Array.from(new Set(list));
  }, [imageUrl, gallery]);

  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0] ?? null;

  if (!main) {
    return (
      <div className="sp-gallery sp-gallery--empty">
        <p className="font-ui text-sm text-muted">تصویری ثبت نشده</p>
      </div>
    );
  }

  return (
    <div className="sp-gallery">
      <div className="sp-gallery__main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={nameFa} />
      </div>
      {images.length > 1 ? (
        <div className="sp-gallery__thumbs" role="list">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              role="listitem"
              className={`sp-gallery__thumb${index === active ? " sp-gallery__thumb--active" : ""}`}
              onClick={() => setActive(index)}
              aria-label={`تصویر ${(index + 1).toLocaleString("fa-IR")}`}
              aria-current={index === active}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
