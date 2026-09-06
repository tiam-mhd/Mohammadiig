import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { ProductEntity } from '../products/product.entity';
import { QuotationEntity } from './quotation.entity';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([QuotationEntity, CustomerEntity, ProductEntity])],
  controllers: [QuotationsController],
  providers: [QuotationsService, RolesGuard],
})
export class QuotationsModule {}
