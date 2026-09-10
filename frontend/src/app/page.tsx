import type { Metadata } from 'next';
import { HomePage } from '@/components/home/HomePage';

export const metadata: Metadata = {
  title: 'MIG | تجهیزات شهربازی و مجموعه‌های تفریحی',
  description:
    'گروه صنعتی محمدی — طراحی، ساخت و پشتیبانی تجهیزات شهربازی؛ از ماشین برخوردی تا قطعات و راه‌اندازی مجموعه.',
};

export default function Home() {
  return <HomePage />;
}
