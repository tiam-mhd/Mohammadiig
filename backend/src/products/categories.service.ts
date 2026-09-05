import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from './category.entity';
import { ProductCategory } from './categories.types';

const seedCategories: Array<Pick<CategoryEntity, 'id' | 'nameEn' | 'nameFa' | 'slug' | 'descriptionFa' | 'displayOrder' | 'isActive'>> = [
  { id: 'equipment', nameEn: 'Equipment', nameFa: 'تجهیزات', slug: 'equipment', descriptionFa: 'تجهیزات اصلی و ماشین های برقی MIG.', displayOrder: 1, isActive: true },
  { id: 'family', nameEn: 'Family', nameFa: 'خانوادگی', slug: 'family', descriptionFa: 'محصولات ایمن برای فضاهای خانوادگی.', displayOrder: 2, isActive: true },
  { id: 'after-sales', nameEn: 'After Sales', nameFa: 'خدمات پس از فروش', slug: 'after-sales', descriptionFa: 'قطعات یدکی و پشتیبانی فنی.', displayOrder: 3, isActive: true },
];

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(CategoryEntity) private readonly repository: Repository<CategoryEntity>) {}

  async seed(): Promise<void> {
    if ((await this.repository.count()) === 0) await this.repository.save(seedCategories);
  }

  async findAll(): Promise<ProductCategory[]> {
    const categories = await this.repository.find({ where: { isActive: true }, order: { displayOrder: 'ASC' } });
    return categories.map((category) => ({
      id: category.id,
      nameEn: category.nameEn,
      nameFa: category.nameFa,
      slug: category.slug,
      descriptionFa: category.descriptionFa,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    }));
  }
}
