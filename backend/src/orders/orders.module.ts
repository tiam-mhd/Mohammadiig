import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { QuotationEntity } from '../quotations/quotation.entity';
import { OrderItemEntity } from './order-item.entity';
import { OrderCustomizationEntity } from './order-customization.entity';
import { OrderEntity } from './order.entity';
import { InvoiceEntity } from '../invoices/invoice.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, OrderCustomizationEntity, QuotationEntity, CustomerEntity, InvoiceEntity])],
  controllers: [OrdersController],
  providers: [OrdersService, RolesGuard],
})
export class OrdersModule {}
