"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useParams } from "next/navigation";
import { fetchPortfolioWork, PortfolioWork } from "@/lib/api-client";
import { labelOf, PORTFOLIO_CATEGORY } from "@/lib/admin-labels";
import { resolveMediaUrl } from "@/lib/media";
import styles from "./detail.module.css";

const Icon = ({ type }: { type: "arrow" | "close" | "image" }) => (
  <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
    {type === "arrow" && <path d="M19 5 5 19M5 5v14h14" />}
    {type === "close" && <path d="m6 6 12 12M6 18 18 6" />}
    {type === "image" && (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1.4" />
        <path d="m3 17 6-6 4 4 3-3 5 5" />
      </>
    )}
  </svg>
);

function locationLine(work: PortfolioWork) {
  return [work.country, work.province, work.city, work.locationDetail]
    .filter(Boolean)
    .join(" · ");
}

export default function PortfolioDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const reduce = useReducedMotion();
  const [work, setWork] = useState<PortfolioWork | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchPortfolioWork(slug)
      .then(setWork)
      .catch(() => setError(true));
  }, [slug]);

  const images = useMemo(() => {
    if (!work) return [];
    return [work.coverImageUrl, ...(work.gallery ?? [])]
      .map(resolveMediaUrl)
      .filter((src, index, all) => src && all.indexOf(src) === index);
  }, [work]);

  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowLeft")
        setSelected((value) => (value + images.length - 1) % images.length);
      if (event.key === "ArrowRight")
        setSelected((value) => (value + 1) % images.length);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightbox, images.length]);

  if (error)
    return (
      <main className={styles.page} dir="rtl">
        <div className={styles.empty}>
          <strong>404</strong>
          <h1>این پروژه در آرشیو پیدا نشد</h1>
          <p>ممکن است پروژه حذف شده باشد یا لینک آن تغییر کرده باشد.</p>
          <Link href="/portfolio" className={styles.button}>
            بازگشت به نمونه‌کارها <Icon type="arrow" />
          </Link>
        </div>
      </main>
    );
  if (!work)
    return (
      <main className={styles.page} dir="rtl">
        <div className={styles.loading}>
          <span />
          <span />
          <span />
          <p>در حال آماده‌سازی پروژه…</p>
        </div>
      </main>
    );

  const title = work.titleFa || work.titleEn;
  const location = locationLine(work);
  const previous = () =>
    setSelected((value) => (value + images.length - 1) % images.length);
  const next = () => setSelected((value) => (value + 1) % images.length);
  const reveal = {
    initial: { opacity: 0, y: reduce ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 0.6 },
  };

  return (
    <main className={styles.page} dir="rtl">
      <div className="content-shell">
        <motion.div {...reveal} className={styles.topbar}>
          <Link href="/portfolio" className={styles.back}>
            <Icon type="arrow" /> همهٔ نمونه‌کارها
          </Link>
          <span>
            MIG / PROJECT {String(work.displayOrder).padStart(2, "0")}
          </span>
        </motion.div>
        <motion.header {...reveal} className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              <i /> {labelOf(PORTFOLIO_CATEGORY, work.workCategory)}
            </p>
            <h1>{title}</h1>
            {work.summaryFa && (
              <p className={styles.summary}>{work.summaryFa}</p>
            )}
          </div>
          <aside>
            <small>CASE STUDY</small>
            <strong>{work.isFeatured ? "01" : "—"}</strong>
            <span>{work.isFeatured ? "پروژهٔ منتخب" : "آرشیو پروژه‌ها"}</span>
          </aside>
        </motion.header>
        <motion.section
          {...reveal}
          className={styles.gallery}
          aria-label="گالری پروژه"
        >
          <div className={styles.mainImage}>
            {images.length ? (
              <button
                type="button"
                onClick={() => setLightbox(true)}
                aria-label="باز کردن تصویر بزرگ"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={images[selected]}
                    src={images[selected]}
                    alt={`${title}، تصویر ${selected + 1}`}
                    initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.7 }}
                  />
                </AnimatePresence>
              </button>
            ) : (
              <div className={styles.noImage}>
                <Icon type="image" />
                <span>تصویری برای این پروژه ثبت نشده است</span>
              </div>
            )}
            {images.length > 1 && (
              <div className={styles.nav}>
                <button
                  type="button"
                  onClick={previous}
                  aria-label="تصویر قبلی"
                >
                  ←
                </button>
                <span>
                  {selected + 1} / {images.length}
                </span>
                <button type="button" onClick={next} aria-label="تصویر بعدی">
                  →
                </button>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className={styles.thumbs} role="tablist">
              {images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  role="tab"
                  aria-selected={selected === index}
                  className={selected === index ? styles.activeThumb : ""}
                  onClick={() => setSelected(index)}
                >
                  <img src={src} alt={`تصویر ${index + 1}`} loading="lazy" />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          )}
        </motion.section>
        <div className={styles.content}>
          <motion.article {...reveal}>
            <p className={styles.label}>داستان پروژه</p>
            <div className={styles.description}>
              <p>{work.descriptionFa || work.summaryFa}</p>
            </div>
            {work.highlights?.length > 0 && (
              <div className={styles.highlights}>
                <p className={styles.label}>نکات کلیدی اجرا</p>
                <ul>
                  {work.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.article>
          <motion.aside {...reveal} className={styles.info}>
            <p className={styles.label}>مشخصات پروژه</p>
            <dl>
              {work.clientName && (
                <div>
                  <dt>مشتری</dt>
                  <dd>{work.clientName}</dd>
                </div>
              )}
              {location && (
                <div>
                  <dt>موقعیت</dt>
                  <dd>{location}</dd>
                </div>
              )}
              {work.areaOrCapacity && (
                <div>
                  <dt>ظرفیت / مقیاس</dt>
                  <dd>{work.areaOrCapacity}</dd>
                </div>
              )}
              {(work.startDate || work.endDate) && (
                <div>
                  <dt>بازهٔ اجرا</dt>
                  <dd dir="ltr">
                    {[work.startDate, work.endDate].filter(Boolean).join(" — ")}
                  </dd>
                </div>
              )}
              {(work.priceNegotiable ||
                (work.priceBase != null && work.priceBase > 0)) && (
                <div>
                  <dt>هزینه</dt>
                  <dd>
                    {work.priceNegotiable
                      ? "توافقی"
                      : `${work.priceBase!.toLocaleString("fa-IR")} ریال`}
                  </dd>
                </div>
              )}
            </dl>
            <Link href="/quote-request" className={styles.button}>
              درخواست پروژهٔ مشابه <Icon type="arrow" />
            </Link>
          </motion.aside>
        </div>
        <motion.footer {...reveal} className={styles.cta}>
          <div>
            <p className={styles.eyebrow}>
              <i /> فصل بعدی، پروژهٔ شما
            </p>
            <h2>ایدهٔ بعدی‌تان را با ما بسازید.</h2>
          </div>
          <Link href="/quote-request">
            شروع همکاری <Icon type="arrow" />
          </Link>
        </motion.footer>
      </div>
      <AnimatePresence>
        {lightbox && images.length > 0 && (
          <motion.div
            className={styles.lightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className={styles.close}
              onClick={() => setLightbox(false)}
              aria-label="بستن"
            >
              <Icon type="close" />
            </button>
            <button
              type="button"
              className={styles.lightboxPrev}
              onClick={(event) => {
                event.stopPropagation();
                previous();
              }}
              aria-label="قبلی"
            >
              →
            </button>
            <motion.img
              key={images[selected]}
              src={images[selected]}
              alt={`${title}، تصویر بزرگ`}
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              onClick={(event) => event.stopPropagation()}
            />
            <button
              type="button"
              className={styles.lightboxNext}
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
              aria-label="بعدی"
            >
              ←
            </button>
            <span className={styles.count}>
              {selected + 1} / {images.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
