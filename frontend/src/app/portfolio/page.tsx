"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { fetchPortfolioWorks, PortfolioWork } from "@/lib/api-client";
import { labelOf, PORTFOLIO_CATEGORY } from "@/lib/admin-labels";
import { resolveMediaUrl } from "@/lib/media";
import styles from "./portfolio.module.css";
const icon = (name: string) =>
  name === "search"
    ? "⌕"
    : name === "grid"
      ? "⊞"
      : name === "list"
        ? "☷"
        : name === "close"
          ? "×"
          : name === "arrow"
            ? "↙"
            : "⌖";
const normalize = (v: string) =>
  v.normalize("NFKC").replace(/[ي]/g, "ی").replace(/[ك]/g, "ک").toLowerCase();
function Card({
  work,
  index,
  list,
}: {
  work: PortfolioWork;
  index: number;
  list: boolean;
}) {
  const reduce = useReducedMotion();
  const images = useMemo(
    () => [
      ...new Set(
        [work.coverImageUrl, ...(work.gallery || [])]
          .map(resolveMediaUrl)
          .filter(Boolean),
      ),
    ],
    [work],
  );
  const [slide, setSlide] = useState(0);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (!hover || reduce || images.length < 2) return;
    const timer = setInterval(
      () => setSlide((n) => (n + 1) % images.length),
      3000,
    );
    return () => clearInterval(timer);
  }, [hover, reduce, images.length]);
  const src = images[slide % Math.max(images.length, 1)];
  return (
    <motion.article
      className={`${styles.card} ${list ? styles.listCard : ""}`}
      initial={{ opacity: 0, y: reduce ? 0 : 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ delay: (index % 3) * 0.06 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={`/portfolio/${work.slug}`}
        className={styles.media}
        aria-label={`مشاهده ${work.titleFa}`}
      >
        {src ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={src}
              src={src}
              alt={work.titleFa}
              loading="lazy"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            />
          </AnimatePresence>
        ) : (
          <span className={styles.noImage}>
            {icon("image")}
            <small>MIG PROJECT ARCHIVE</small>
          </span>
        )}
        <span className={styles.shade} />
        <span className={styles.open}>{icon("arrow")}</span>
        <span className={styles.badge}>
          {labelOf(PORTFOLIO_CATEGORY, work.workCategory)}
        </span>
        {images.length > 1 && (
          <span className={styles.gallery}>
            {icon("image")} {slide + 1} / {images.length}
          </span>
        )}
      </Link>
      <div className={styles.body}>
        <div className={styles.meta}>
          {[work.province, work.city].filter(Boolean).join("، ") ||
            "پروژهٔ اجراشده"}{" "}
          <b>{String(index + 1).padStart(2, "0")}</b>
        </div>
        <h2>
          <Link href={`/portfolio/${work.slug}`}>{work.titleFa}</Link>
        </h2>
        <p>{work.summaryFa}</p>
        <div className={styles.footer}>
          {work.clientName && <span>مشتری: {work.clientName}</span>}
          <Link href={`/portfolio/${work.slug}`}>
            کشف پروژه {icon("arrow")}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
export default function PortfolioPage() {
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("selected");
  const [province, setProvince] = useState("all");
  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetchPortfolioWorks()
      .then(setWorks)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const categories = [...new Set(works.map((w) => w.workCategory))];
  const provinces = [
    ...new Set(works.map((w) => w.province).filter(Boolean)),
  ] as string[];
  const filtered = works
    .filter((w) => {
      const text = normalize(
        [w.titleFa, w.titleEn, w.summaryFa, w.clientName, w.city, w.province]
          .filter(Boolean)
          .join(" "),
      );
      return (
        (category === "all" || w.workCategory === category) &&
        (province === "all" || w.province === province) &&
        normalize(query)
          .split(" ")
          .filter(Boolean)
          .every((x) => text.includes(x))
      );
    })
    .sort((a, b) =>
      sort === "title"
        ? a.titleFa.localeCompare(b.titleFa, "fa")
        : Number(b.isFeatured) - Number(a.isFeatured) ||
          a.displayOrder - b.displayOrder,
    );
  const clear = () => {
    setQuery("");
    setCategory("all");
    setProvince("all");
  };
  return (
    <main className={styles.page} dir="rtl">
      <div className="content-shell">
        <header className={styles.hero}>
          <Link href="/" className={styles.crumb}>
            خانه <i>/</i> نمونه‌کارها
          </Link>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.eyebrow}>● از ایده تا اجرا</p>
              <h1>
                تجربه‌هایی که
                <br />
                <em>ساخته‌ایم.</em>
              </h1>
              <p className={styles.lead}>
                هر پروژه، داستان یک همکاری است. نگاهی به فضاهایی که با دقت
                طراحی، تجهیز و آمادهٔ تجربه شده‌اند.
              </p>
              <a href="#results" className={styles.explore}>
                کشف نمونه‌کارها {icon("arrow")}
              </a>
            </div>
            <aside>
              <small>MIG / PROJECT ARCHIVE</small>
              <p>جزئیات، تفاوت را می‌سازند.</p>
              <strong>{works.length || "—"}</strong>
              <span> پروژه در مجموعه</span>
            </aside>
          </div>
          <div className={styles.heroFoot}>
            <span>نمونه‌کارهای گروه صنعتی محمدی</span>
            <span>DESIGNED. BUILT. EXPERIENCED.</span>
          </div>
        </header>
        <section id="results" className={styles.catalog}>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              {icon("search")}
              <input
                aria-label="جستجوی نمونه‌کارها"
                placeholder="نام پروژه، شهر یا مشتری را جستجو کنید…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="پاک کردن">
                  {icon("close")}
                </button>
              )}
            </label>
            <select
              aria-label="استان"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            >
              <option value="all">همهٔ استان‌ها</option>
              {provinces.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              aria-label="مرتب‌سازی"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="selected">پیشنهاد ما</option>
              <option value="title">نام پروژه</option>
            </select>
          </div>
          <div className={styles.filters}>
            <div>
              {["all", ...categories].map((c) => (
                <button
                  key={c}
                  className={category === c ? styles.active : ""}
                  onClick={() => setCategory(c)}
                >
                  {c === "all"
                    ? "همهٔ پروژه‌ها"
                    : labelOf(PORTFOLIO_CATEGORY, c)}{" "}
                  <small>
                    {
                      works.filter((w) => c === "all" || w.workCategory === c)
                        .length
                    }
                  </small>
                </button>
              ))}
            </div>
            <nav>
              <button
                aria-label="شبکه‌ای"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
              >
                {icon("grid")}
              </button>
              <button
                aria-label="لیستی"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                {icon("list")}
              </button>
            </nav>
          </div>
          <div className={styles.resultMeta}>
            <span>
              {loading
                ? "در حال دریافت…"
                : error
                  ? "دریافت اطلاعات ناموفق بود"
                  : `${filtered.length} پروژه`}
            </span>
            {(query || category !== "all" || province !== "all") && (
              <button onClick={clear}>حذف فیلترها {icon("close")}</button>
            )}
          </div>
          {loading ? (
            <div className={styles.loading}>
              در حال آماده‌سازی آرشیو نمونه‌کارها…
            </div>
          ) : error ? (
            <div className={styles.empty}>
              <h2>دریافت نمونه‌کارها امکان‌پذیر نبود</h2>
              <button onClick={load}>تلاش دوباره</button>
            </div>
          ) : filtered.length ? (
            <div className={view === "grid" ? styles.grid : styles.list}>
              {filtered.map((w, i) => (
                <Card key={w.id} work={w} index={i} list={view === "list"} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <h2>پروژه‌ای با این مشخصات پیدا نشد</h2>
              <button onClick={clear}>مشاهدهٔ همهٔ پروژه‌ها</button>
            </div>
          )}
        </section>
        <section className={styles.cta}>
          <div>
            <p className={styles.eyebrow}>فصل بعدی، پروژهٔ شما</p>
            <h2>برای ساختن یک تجربهٔ تازه آماده‌اید؟</h2>
          </div>
          <Link href="/quote-request">شروع همکاری {icon("arrow")}</Link>
        </section>
      </div>
    </main>
  );
}
