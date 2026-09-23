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
import { SparePartEntity } from '../products/spare-part.entity';
import { UserEntity } from '../auth/user.entity';
import { PaymentEntity } from '../payments/payment.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      OrderCustomizationEntity,
      QuotationEntity,
      CustomerEntity,
      InvoiceEntity,
      SparePartEntity,
      UserEntity,
      PaymentEntity,
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, RolesGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
