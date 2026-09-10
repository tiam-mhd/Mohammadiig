'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PILLARS_SCENE =
  'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fm=webp&fit=crop&w=1600&q=70';

const PROOF_SCENE =
  'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fm=webp&fit=crop&w=1600&q=72';

const pillars = [
  {
    title: 'ساخت و تأمین',
    body: 'دستگاه‌هایی برای سالن واقعی؛ مقاوم، قابل نگهداری و آماده کار مداوم.',
  },
  {
    title: 'راه‌اندازی مجموعه',
    body: 'از چیدمان فضا تا نصب و بهره‌برداری؛ تا مجموعه به درآمد برسد.',
  },
  {
    title: 'پشتیبانی فنی',
    body: 'قطعات اصلی و خدمات بعد از فروش تا دستگاه‌ها خواب نمانند.',
  },
];

const products = [
  {
    index: '01',
    name: 'ماشین برخوردی حرفه‌ای',
    tagline: 'برای سالن‌های پرتردد؛ بدنه مقاوم و نگهداری آسان.',
    href: '/products/bumper-car-signature',
    image:
      'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fm=webp&fit=crop&w=1600&q=75',
  },
  {
    index: '02',
    name: 'ماشین کودک',
    tagline: 'ایمن، کم‌صدا و جذاب برای فضاهای خانوادگی.',
    href: '/products/junior-play',
    image:
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fm=webp&fit=crop&w=1200&q=75',
  },
  {
    index: '03',
    name: 'قطعات و پشتیبانی',
    tagline: 'قطعات اصلی و خدمات فنی برای تداوم کار مجموعه.',
    href: '/spare-parts',
    image:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fm=webp&fit=crop&w=1200&q=75',
  },
];

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
            trigger: root.querySelector('.home-pillars__grid'),
            start: 'top 80%',
          },
        }
      );

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
    { scope: rootRef, dependencies: [reduce] }
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

        {/* Pillars — glass bento */}
        <section className="home-pillars">
          <div className="home-pillars__scene" aria-hidden>
            <img src={PILLARS_SCENE} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="content-shell">
            <div className="home-pillars__head" data-reveal>
              <div>
                <p className="home-kicker">فعالیت ما</p>
                <h2 className="home-section-title">سه تعهد اصلی گروه صنعتی محمدی</h2>
              </div>
              <p className="home-section-lede home-pillars__lede">
                ساخت دستگاه، راه‌اندازی مجموعه، و پشتیبانی بعد از فروش — یک مسیر کامل برای صاحبان
                شهربازی.
              </p>
            </div>

            <div className="home-pillars__grid">
              {pillars.map((item, i) => (
                <GlassPanel
                  key={item.title}
                  as="article"
                  mode="backdrop"
                  className={`home-glass-card home-glass-card--${i + 1}`}
                >
                  <span className="home-glass-card__index" lang="en">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="home-glass-card__title">{item.title}</h3>
                  <p className="home-glass-card__body">{item.body}</p>
                </GlassPanel>
              ))}
            </div>

            <div className="home-pillars__cta" data-reveal>
              <GlassButton href="/services">خدمات ما</GlassButton>
            </div>
          </div>
        </section>

        {/* Featured — split magazine */}
        <section className="home-feature">
          <div className="home-feature__layout content-shell">
            <div className="home-feature__frame">
              <div className="home-feature__media">
                <img
                  src={products[0].image}
                  alt={products[0].name}
                  data-parallax="14"
                  loading="lazy"
                  decoding="async"
                />
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
                <h2 className="home-feature__title">{products[0].name}</h2>
                <p className="home-feature__body">{products[0].tagline}</p>
                <ul className="home-feature__points">
                  <li>بدنه مقاوم برای ترافیک بالا</li>
                  <li>نگهداری آسان در سالن واقعی</li>
                  <li>پشتیبانی قطعات پس از فروش</li>
                </ul>
                <GlassButton href={products[0].href}>جزئیات محصول</GlassButton>
              </div>
            </GlassPanel>
          </div>
        </section>

        {/* Horizontal product rail */}
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
              {products.map((product) => (
                <article key={product.href} className="home-rail__card">
                  <div className="home-rail__media">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="home-rail__glow" aria-hidden />
                  <GlassPanel
                    mode="frost"
                    frostSrc={product.image}
                    className="home-rail__copy"
                    bodyClassName="home-rail__copy-inner"
                  >
                    <span className="home-rail__badge" lang="en">
                      {product.index}
                    </span>
                    <h3 className="home-rail__title">{product.name}</h3>
                    <p className="home-rail__body">{product.tagline}</p>
                    <GlassButton href={product.href}>جزئیات محصول</GlassButton>
                  </GlassPanel>
                </article>
              ))}
              <GlassPanel
                mode="frost"
                frostSrc={products[0].image}
                className="home-rail__end"
                bodyClassName="home-rail__end-inner"
              >
                <p className="home-rail__end-label">کاتالوگ کامل</p>
                <GlassButton href="/products">همه محصولات</GlassButton>
              </GlassPanel>
            </div>
          </div>
        </section>

        {/* Proof */}
        <section className="home-proof">
          <div className="home-proof__media">
            <img
              src={PROOF_SCENE}
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
                <h2 className="home-section-title">مجموعه‌هایی که با هم راه انداختیم</h2>
                <p className="home-section-lede">
                  از سالن ماشین برخوردی تا فضاهای خانوادگی؛ کار واقعی با صاحبان مجموعه.
                </p>
                <div className="home-proof__actions">
                  <GlassButton href="/portfolio">دیدن نمونه‌کارها</GlassButton>
                  <Link href="/projects" className="home-text-link">
                    بهره‌برداری‌های ما
                  </Link>
                </div>
              </div>
            </GlassPanel>
          </div>
        </section>

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
