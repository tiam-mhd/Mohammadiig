'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GlassButton } from '@/components/GlassButton';
import { SmoothScroll } from '@/components/SmoothScroll';
import { GlassPanel } from '@/components/home/GlassPanel';
import { ProductRailCard } from '@/components/home/ProductRailCard';
import {
  fetchPortfolioWorks,
  fetchProducts,
  fetchServices,
  type PortfolioWork,
  type Product,
  type ServiceSummary,
} from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/media';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FALLBACK_SCENE = '/Background.webp';

function productImage(product: Product | undefined): string {
  if (!product) return '';
  return resolveMediaUrl(product.image || product.images?.[0]);
}

function useAfterSplash(ready: boolean) {
  const [go, setGo] = useState(false);

  useEffect(() => {
    if (!ready) return;

    const idle = () => {
      const v = document.documentElement.getAttribute('data-splash');
      return !v || v === 'done';
    };

    if (idle()) {
      setGo(true);
      return;
    }

    const obs = new MutationObserver(() => {
      if (idle()) {
        setGo(true);
        obs.disconnect();
      }
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-splash'],
    });

    const t = window.setTimeout(() => setGo(true), 8500);
    return () => {
      obs.disconnect();
      window.clearTimeout(t);
    };
  }, [ready]);

  return go;
}

function HomeHero() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const afterSplash = useAfterSplash(true);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const mediaY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.55], [0, -40]);

  const ease = [0.22, 0.61, 0.36, 1] as const;

  return (
    <section ref={heroRef} className="home-hero">
      <motion.div
        className="home-hero__media"
        style={reduce ? undefined : { y: mediaY, scale: mediaScale }}
      >
        <motion.img
          src="/Background.webp"
          alt="ماشین برخوردی گروه صنعتی محمدی"
          fetchPriority="high"
          decoding="async"
          initial={reduce ? false : { scale: 1.18, opacity: 0.55 }}
          animate={
            afterSplash
              ? { scale: 1, opacity: 1 }
              : { scale: 1.18, opacity: 0.55 }
          }
          transition={{ duration: 2.2, ease }}
        />
        <div className="home-hero__scrim" />
          <div className="home-hero__vignette" aria-hidden />
          <div className="home-hero__grain" aria-hidden />
        </motion.div>

      <motion.div
        className="content-shell home-hero__content"
        style={reduce ? undefined : { opacity: copyOpacity, y: copyY }}
      >
        <div className="home-hero__copy">
          <motion.h1
            className="home-hero__brand"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={afterSplash ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={{ duration: 1.05, delay: 0.12, ease }}
          >
            گروه صنعتی محمدی
          </motion.h1>

          <motion.div
            className="home-hero__rule"
            initial={reduce ? false : { scaleX: 0 }}
            animate={afterSplash ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.95, delay: 0.4, ease }}
            aria-hidden
          />

          <motion.p
            className="home-hero__line"
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={afterSplash ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
            transition={{ duration: 0.95, delay: 0.42, ease }}
          >
            تجهیزات شهربازی، ساخته‌شده برای کار واقعی
          </motion.p>

          <motion.p
            className="home-hero__lede"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={afterSplash ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.9, delay: 0.58, ease }}
          >
            از انتخاب دستگاه تا نصب و پشتیبانی؛ کنار صاحبان شهربازی و مجموعه‌های تفریحی.
          </motion.p>

          <motion.div
            className="home-hero__actions"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={afterSplash ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.85, delay: 0.72, ease }}
          >
            <GlassButton href="/products">مشاهده محصولات</GlassButton>
            <GlassButton href="/quote-request">درخواست قیمت</GlassButton>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="home-hero__scroll"
        aria-hidden
        initial={reduce ? false : { opacity: 0 }}
        animate={afterSplash ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <span />
      </motion.div>
    </section>
  );
}

export function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioWork[]>([]);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetchProducts({ limit: 12 })
        .then((res) => res.data ?? [])
        .catch(() => [] as Product[]),
      fetchServices().catch(() => [] as ServiceSummary[]),
      fetchPortfolioWorks().catch(() => [] as PortfolioWork[]),
    ]).then(([nextProducts, nextServices, nextPortfolio]) => {
      if (!mounted) return;
      setProducts(nextProducts);
      setServices(nextServices);
      setPortfolio(nextPortfolio);
      setDataReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const featuredProduct = useMemo(() => {
    if (!products.length) return null;
    return products.find((p) => p.isFeatured) ?? products[0];
  }, [products]);

  const railProducts = useMemo(
    () =>
      products.map((product, i) => ({
        id: product.id,
        index: String(i + 1).padStart(2, '0'),
        name: product.name,
        tagline: product.description || product.category,
        href: `/products/${product.slug}`,
        image: productImage(product),
      })),
    [products]
  );

  const featuredImage = productImage(featuredProduct ?? undefined);
  const proofWork =
    portfolio.find((w) => w.isFeatured) ?? portfolio[0] ?? null;
  const proofImage =
    resolveMediaUrl(proofWork?.coverImageUrl || proofWork?.gallery?.[0]) ||
    FALLBACK_SCENE;
  const pillarsScene =
    featuredImage ||
    resolveMediaUrl(proofWork?.coverImageUrl) ||
    FALLBACK_SCENE;

  useGSAP(
    () => {
      if (reduce) return;
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-reveal]')).forEach((el) => {
        /* opacity-only — transform kills backdrop-filter on glass children */
        gsap.fromTo(
          el,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 1.05,
            ease: 'power2.out',
            clearProps: 'transform',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-parallax]')).forEach((el) => {
        const speed = Number(el.dataset.parallax || 12);
        gsap.to(el, {
          yPercent: speed,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('section') || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      const pillarsGrid = root.querySelector('.home-pillars__grid');
      if (pillarsGrid) {
        gsap.fromTo(
          root.querySelectorAll('.home-glass-card'),
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.95,
            stagger: 0.14,
            ease: 'power2.out',
            clearProps: 'transform',
            scrollTrigger: {
              trigger: pillarsGrid,
              start: 'top 80%',
            },
          }
        );
      }

      const statNum = root.querySelector('.home-legacy__stat-num');
      if (statNum) {
        const counter = { val: 0 };
        gsap.to(counter, {
          val: 40,
          duration: 1.8,
          ease: 'power2.out',
          snap: { val: 1 },
          scrollTrigger: {
            trigger: '.home-legacy',
            start: 'top 72%',
            toggleActions: 'play none none none',
          },
          onUpdate: () => {
            statNum.textContent = String(counter.val);
          },
        });
      }

      mm.add('(min-width: 900px)', () => {
        const track = trackRef.current;
        const viewport = root.querySelector('.home-rail__viewport') as HTMLElement | null;
        if (!track || !viewport) return;

        const getDistance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

        /*
          Track چسبیده به راست (right:0) → از ابتدا محصول ۰۱ دیده می‌شود.
          اسکرول: x از 0 تا +distance → حرکت یکدست به راست تا باکس آخر.
        */
        gsap.set(track, { x: 0 });

        const tween = gsap.fromTo(
          track,
          { x: 0 },
          {
            x: () => getDistance(),
            ease: 'none',
            immediateRender: true,
            scrollTrigger: {
              trigger: viewport,
              start: 'top top',
              end: () => `+=${getDistance()}`,
              pin: true,
              pinSpacing: true,
              scrub: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              fastScrollEnd: true,
              onRefreshInit: () => {
                gsap.set(track, { x: 0 });
              },
            },
          }
        );

        const refresh = () => ScrollTrigger.refresh();
        const imgs = Array.from(track.querySelectorAll('img'));
        imgs.forEach((img) => {
          if (!img.complete) img.addEventListener('load', refresh, { once: true });
        });
        window.addEventListener('load', refresh);
        window.addEventListener('resize', refresh);
        requestAnimationFrame(() => {
          requestAnimationFrame(refresh);
        });

        return () => {
          window.removeEventListener('load', refresh);
          window.removeEventListener('resize', refresh);
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { clearProps: 'transform' });
        };
      });

      ScrollTrigger.refresh();

      const splashIdle = () => {
        const v = document.documentElement.getAttribute('data-splash');
        return !v || v === 'done';
      };
      if (!splashIdle()) {
        const obs = new MutationObserver(() => {
          if (splashIdle()) {
            ScrollTrigger.refresh();
            obs.disconnect();
          }
        });
        obs.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-splash'],
        });
      }
    },
    {
      scope: rootRef,
      dependencies: [
        reduce,
        dataReady,
        products.length,
        services.length,
        portfolio.length,
      ],
    }
  );

  return (
    <SmoothScroll>
      <div ref={rootRef} className="home-page">
        <HomeHero />

        {/* Legacy — denser split */}
        <section className="home-legacy">
          <div className="content-shell home-legacy__grid">
            <div className="home-legacy__stat" data-reveal>
              <p className="home-kicker">سابقه</p>
              <p className="home-legacy__stat-line" lang="en">
                <span className="home-legacy__stat-num">40</span>
                <span className="home-legacy__stat-plus">+</span>
              </p>
              <div className="home-legacy__goldline" aria-hidden />
            </div>
            <div className="home-legacy__copy" data-reveal>
              <h2 className="home-legacy__title">بیش از چهل سال در صنعت تفریح</h2>
              <p className="home-legacy__body">
                از کارگاه تا سالن شهربازی؛ تجربه واقعی ساخت، نصب، بهره‌برداری و نگهداری دستگاه‌ها —
                برای مجموعه‌هایی که باید هر روز کار کنند.
              </p>
              <GlassButton href="/portfolio">نمونه‌کارها</GlassButton>
            </div>
          </div>
        </section>

        {/* Pillars — from services */}
        {services.length > 0 ? (
          <section className="home-pillars">
            <div className="home-pillars__scene" aria-hidden>
              <img src={pillarsScene} alt="" loading="lazy" decoding="async" />
            </div>
            <div className="content-shell">
              <div className="home-pillars__head" data-reveal>
                <div>
                  <p className="home-kicker">فعالیت ما</p>
                  <h2 className="home-section-title">خدمات گروه صنعتی محمدی</h2>
                </div>
                <p className="home-section-lede home-pillars__lede">
                  از ساخت و نصب تا آموزش و پشتیبانی — یک مسیر کامل برای صاحبان شهربازی.
                </p>
              </div>

              <div className="home-pillars__grid">
                {services.map((item, i) => (
                  <GlassPanel
                    key={item.id}
                    as="article"
                    mode="backdrop"
                    className={`home-glass-card home-glass-card--${(i % 3) + 1}`}
                  >
                    <span className="home-glass-card__index" lang="en">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="home-glass-card__title">{item.nameFa}</h3>
                    <p className="home-glass-card__body">{item.description}</p>
                  </GlassPanel>
                ))}
              </div>

              <div className="home-pillars__cta" data-reveal>
                <GlassButton href="/services">خدمات ما</GlassButton>
              </div>
            </div>
          </section>
        ) : null}

        {/* Featured product */}
        {featuredProduct ? (
          <section className="home-feature">
            <div className="home-feature__layout content-shell">
              <div className="home-feature__frame">
                <div className="home-feature__media">
                  {featuredImage ? (
                    <img
                      src={featuredImage}
                      alt={featuredProduct.name}
                      data-parallax="14"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="home-rail__placeholder" aria-hidden>
                      <span>بدون تصویر</span>
                    </div>
                  )}
                </div>
                <div className="home-feature__scrim" />
              </div>
              <GlassPanel
                as="aside"
                mode="backdrop"
                className="home-feature__aside"
              >
                <div data-reveal>
                  <p className="home-kicker home-kicker--gold">محصول شاخص</p>
                  <h2 className="home-feature__title">{featuredProduct.name}</h2>
                  <p className="home-feature__body">
                    {featuredProduct.description || featuredProduct.category}
                  </p>
                  <GlassButton href={`/products/${featuredProduct.slug}`}>
                    جزئیات محصول
                  </GlassButton>
                </div>
              </GlassPanel>
            </div>
          </section>
        ) : null}

        {/* Horizontal product rail */}
        {railProducts.length > 0 ? (
          <section className="home-rail">
            <div className="content-shell home-rail__intro" data-reveal>
              <p className="home-kicker">محصولات</p>
              <h2 className="home-section-title">برای هر فضا، دستگاه مناسب</h2>
              <p className="home-section-lede">
                سالن حرفه‌ای، فضای کودک، یا پشتیبانی قطعات — مسیر را با نیاز مجموعه شما شروع می‌کنیم.
              </p>
            </div>

            <div className="home-rail__viewport">
              <div ref={trackRef} className="home-rail__track">
                {railProducts.map((product) => (
                  <ProductRailCard key={product.id} {...product} />
                ))}
                <GlassPanel
                  mode={featuredImage ? 'frost' : 'backdrop'}
                  frostSrc={featuredImage || undefined}
                  className="home-rail__end"
                  bodyClassName="home-rail__end-inner"
                >
                  <p className="home-rail__end-label">کاتالوگ کامل</p>
                  <GlassButton href="/products">همه محصولات</GlassButton>
                </GlassPanel>
              </div>
            </div>
          </section>
        ) : null}

        {/* Proof — from portfolio */}
        {proofWork ? (
          <section className="home-proof">
            <div className="home-proof__media">
              <img
                src={proofImage}
                alt=""
                data-parallax="10"
                loading="lazy"
                decoding="async"
              />
              <div className="home-proof__scrim" />
            </div>
            <div className="content-shell home-proof__content">
              <GlassPanel mode="backdrop" className="home-proof__panel">
                <div data-reveal>
                  <p className="home-kicker">نمونه‌کارها</p>
                  <h2 className="home-section-title">{proofWork.titleFa}</h2>
                  <p className="home-section-lede">
                    {proofWork.summaryFa ||
                      'از سالن ماشین برخوردی تا فضاهای خانوادگی؛ کار واقعی با صاحبان مجموعه.'}
                  </p>
                  <div className="home-proof__actions">
                    <GlassButton href={`/portfolio/${proofWork.slug}`}>
                      دیدن این نمونه‌کار
                    </GlassButton>
                    <Link href="/portfolio" className="home-text-link">
                      همه نمونه‌کارها
                    </Link>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </section>
        ) : null}

        {/* Close */}
        <section className="home-close">
          <div className="home-close__media">
            <img src="/Background-cta.webp" alt="" loading="lazy" decoding="async" />
            <div className="home-close__scrim" />
          </div>
          <div className="content-shell home-close__content">
            <GlassPanel mode="backdrop" className="home-close__panel">
              <div data-reveal>
                <p className="home-kicker home-kicker--gold">قدم بعدی</p>
                <h2 className="home-close__title">برای مجموعه خودتان آماده‌اید؟</h2>
                <p className="home-close__body">
                  ابعاد فضا، ظرفیت بازدیدکننده و بودجه را بگویید؛ پیشنهاد دستگاه و برآورد قیمت را
                  برایتان می‌فرستیم.
                </p>
                <GlassButton href="/quote-request">درخواست مشاوره رایگان</GlassButton>
              </div>
            </GlassPanel>
          </div>
        </section>
      </div>
    </SmoothScroll>
  );
}
