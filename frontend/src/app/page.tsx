import type { Metadata } from 'next';
import Link from 'next/link';
import { PhotoBand } from '@/components/home/PhotoBand';
import { ModelBand } from '@/components/home/ModelBand';
import { Reveal } from '@/components/home/Reveal';
import { FloatingConsultCard } from '@/components/home/FloatingConsultCard';

export const metadata: Metadata = {
  title: 'MIG | تجهیزات شهربازی و مجموعه‌های تفریحی',
  description: 'ساخت، تأمین و پشتیبانی تجهیزات شهربازی؛ از ماشین برخوردی تا قطعات و خدمات.',
};

/** فاصله تنفس سیاه بین فصل‌های صفحه */
function SectionGap() {
  return <div className="h-12 bg-canvas sm:h-16 md:h-24 lg:h-28" aria-hidden />;
}

const models = [
  {
    index: 'محصول ۰۱',
    name: 'ماشین برخوردی حرفه‌ای',
    tagline: 'برای سالن‌های شلوغ شهربازی؛ بدنه مقاوم و نگهداری آسان.',
    href: '/products/bumper-car-signature',
    image:
      'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=2000&q=85',
  },
  {
    index: 'محصول ۰۲',
    name: 'ماشین کودک',
    tagline: 'مناسب فضای خانوادگی؛ ایمن، کم‌صدا و جذاب برای بچه‌ها.',
    href: '/products/junior-play',
    image:
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=2000&q=85',
  },
  {
    index: 'محصول ۰۳',
    name: 'قطعات و پشتیبانی',
    tagline: 'قطعات اصلی و خدمات فنی تا دستگاه‌هایتان خواب نمانند.',
    href: '/spare-parts',
    image:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=2000&q=85',
  },
];

export default function Home() {
  return (
    <div className="bg-canvas">
      {/* هیرو — موبایل: متن پایین؛ دسکتاپ: ستون راست دور از ماشین */}
      <section className="hero">
        <div className="hero__media">
          <img
            src="/Background.png"
            alt="ماشین برخوردی MIG"
            className="kenburns"
            fetchPriority="high"
          />
          <div className="hero__scrim" />
        </div>

        <div className="content-shell hero__content">
          <div className="hero__copy">
            <p className="caption-up animate-fade-up text-white/70">
              تجهیزات شهربازی و مجموعه‌های تفریحی
            </p>
            <h1 className="display-monumental animate-fade-up-delay mt-3 md:mt-4">
              طراحی، تولید، مشاوره
            </h1>
            <p className="body-lead animate-fade-up-delay-2 mt-4 max-w-sm md:mt-5">
              از انتخاب دستگاه تا نصب و پشتیبانی؛ کنار صاحبان شهربازی و مجموعه‌های تفریحی هستیم.
            </p>
            <div className="hero__actions animate-fade-up-delay-3">
              <Link href="/products" className="btn-pill">
                مشاهده محصولات
              </Link>
              <Link
                href="/quote-request"
                className="caption-up text-white/85 transition-opacity hover:opacity-60"
              >
                درخواست قیمت ←
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FloatingConsultCard />

      <SectionGap />

      {/* معرفی — راست‌چین طبیعی RTL */}
      <PhotoBand
        image="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=2000&q=80"
        eyebrow="درباره MIG"
        title="گروه صنعتی محمدی"
        body="ما تجهیزات شهربازی تولید و تأمین می‌کنیم و در راه‌اندازی و نگهداری مجموعه‌ها کنار شما هستیم."
        ctaLabel="بهره‌برداری‌های ما"
        ctaHref="/projects"
        align="start"
        overlay="bottom"
      />

      <SectionGap />

      {/* خدمات — راست‌چین، لیست‌گونه */}
      <PhotoBand
        image="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=2000&q=80"
        eyebrow="چه می‌کنیم"
        title="سه کار اصلی ما"
        body="ساخت و فروش دستگاه، راه‌اندازی مجموعه، و پشتیبانی فنی بعد از فروش."
        ctaLabel="خدمات ما"
        ctaHref="/services"
        align="start"
        overlay="right"
        objectPosition="center top"
      />

      <SectionGap />

      {/* سابقه — وسط‌چین برای جمله کوتاه هویتی */}
      <section className="relative flex min-h-[48svh] items-center overflow-hidden bg-canvas md:min-h-[52svh]">
        <div className="content-shell section-copy">
          <Reveal className="mx-auto max-w-lg text-center">
            <p className="caption-up">سابقه کار</p>
            <h2 className="display-feature mt-4">بیش از بیست سال در صنعت تفریح</h2>
            <p className="body-lead mx-auto mt-4 max-w-md">
              از کارگاه تا سالن شهربازی؛ تجربه واقعی نصب، بهره‌برداری و نگهداری دستگاه‌ها.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/portfolio" className="btn-pill">
                نمونه‌کارها
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SectionGap />

      {/* استعلام — وسط‌چین چون دعوت به اقدام است */}
      <PhotoBand
        image="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=2000&q=80"
        eyebrow="سفارش و قیمت"
        title="دستگاه را مطابق فضای خودتان بگیرید"
        body="ابعاد سالن، ظرفیت بازدیدکننده و بودجه را بگویید؛ طرح و قیمت مناسب را برایتان آماده می‌کنیم."
        ctaLabel="درخواست قیمت"
        ctaHref="/quote-request"
        align="center"
        overlay="full"
        minHeight="min-h-[68svh] md:min-h-[72svh]"
      />

      <SectionGap />

      {/* نمونه‌کارها — راست‌چین */}
      <PhotoBand
        image="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=2000&q=80"
        eyebrow="نمونه‌کارها"
        title="مجموعه‌هایی که با هم راه انداختیم"
        body="از سالن ماشین برخوردی تا فضاهای خانوادگی؛ نمونه‌هایی از کار با صاحبان مجموعه."
        ctaLabel="دیدن نمونه‌کارها"
        ctaHref="/portfolio"
        align="start"
        overlay="left"
      />

      <SectionGap />

      {/* معرفی محصولات — راست‌چین */}
      <section className="bg-canvas py-12 md:py-24 md:pb-28">
        <div className="content-shell">
          <Reveal className="max-w-lg text-start">
            <p className="caption-up">محصولات</p>
            <h2 className="display-feature mt-4">چند نمونه از دستگاه‌های ما</h2>
            <p className="body-lead mt-4 max-w-md">
              برای سالن شهربازی، فضای کودک و پشتیبانی بعد از فروش، گزینه مناسب دارید.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="flex flex-col gap-12 md:gap-24">
        {models.map((model) => (
          <ModelBand key={model.href} {...model} />
        ))}
      </div>

      <SectionGap />

      {/* CTA پایانی — وسط‌چین */}
      <section className="relative flex min-h-[52svh] overflow-hidden md:min-h-[56svh]">
        <div className="absolute inset-0">
          <img
            src="/Background.png"
            alt=""
            className="h-full w-full object-cover opacity-55"
            style={{ objectPosition: '60% center' }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>
        <div className="content-shell section-copy relative z-10 flex w-full flex-col items-center justify-end text-center">
          <Reveal className="max-w-md">
            <p className="caption-up text-white/70">قدم بعدی</p>
            <h2 className="display-feature mt-4">برای مجموعه خودتان آماده‌اید؟</h2>
            <p className="body-lead mx-auto mt-4 max-w-sm">
              مشخصات فضا را بفرستید تا پیشنهاد دستگاه و برآورد قیمت را برایتان بفرستیم.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/quote-request" className="btn-pill">
                درخواست مشاوره رایگان
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
