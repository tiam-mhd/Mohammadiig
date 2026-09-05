import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './service.entity';

const seedServices: Array<Pick<ServiceEntity, 'id' | 'nameEn' | 'nameFa' | 'description' | 'serviceCategory' | 'basePrice' | 'currency' | 'unitType' | 'isActive'>> = [
  { id: 'installation', nameEn: 'Installation & Setup', nameFa: 'نصب و راه‌اندازی', description: 'نصب تخصصی تجهیزات و آماده‌سازی مجموعه برای بهره‌برداری.', serviceCategory: 'installation', basePrice: 0, currency: 'IRR', unitType: 'fixed', isActive: true },
  { id: 'training', nameEn: 'Operator Training', nameFa: 'آموزش اپراتور', description: 'آموزش تیم بهره‌برداری برای استفاده ایمن و حرفه‌ای.', serviceCategory: 'training', basePrice: 0, currency: 'IRR', unitType: 'per_day', isActive: true },
  { id: 'support', nameEn: 'MIG Care Support', nameFa: 'پشتیبانی MIG Care', description: 'پشتیبانی فنی و تامین قطعات برای عملکرد پایدار پروژه.', serviceCategory: 'support', basePrice: 0, currency: 'IRR', unitType: 'per_visit', isActive: true },
];

@Injectable()
export class ServicesService implements OnModuleInit {
  constructor(@InjectRepository(ServiceEntity) private readonly services: Repository<ServiceEntity>) {}

  async seed(): Promise<void> { if ((await this.services.count()) === 0) await this.services.save(seedServices); }
  onModuleInit(): Promise<void> { return this.seed(); }
  findAll(): Promise<ServiceEntity[]> { return this.services.find({ where: { isActive: true }, order: { createdAt: 'ASC' } }); }
}
