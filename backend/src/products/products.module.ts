import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductEntity } from './product.entity';
import { CategoryEntity } from './category.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';
import { RolesGuard } from '../auth/roles.guard';
import { ProductVariantEntity } from './product-variant.entity';
import { ProductSpecificationEntity } from './product-specification.entity';
import { SparePartEntity } from './spare-part.entity';
import { ProductExtensionsService } from './product-extensions.service';
import { SparePartsController } from './spare-parts.controller';

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([ProductEntity, CategoryEntity, ProductVariantEntity, ProductSpecificationEntity, SparePartEntity])],
  controllers: [ProductsController, CategoriesController, SparePartsController],
  providers: [ProductsService, CategoriesService, RolesGuard, ProductExtensionsService],
  exports: [ProductsService, CategoriesService],
})
export class ProductsModule {}
