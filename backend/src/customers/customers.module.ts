import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerEntity } from "./customer.entity";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";
import { RolesGuard } from "../auth/roles.guard";
import { UserEntity } from "../auth/user.entity";
import { OrderEntity } from "../orders/order.entity";
import { OrderItemEntity } from "../orders/order-item.entity";
import { InvoiceEntity } from "../invoices/invoice.entity";
import { PaymentEntity } from "../payments/payment.entity";
import { QuotationEntity } from "../quotations/quotation.entity";

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([
      CustomerEntity,
      UserEntity,
      OrderEntity,
      OrderItemEntity,
      InvoiceEntity,
      PaymentEntity,
      QuotationEntity,
    ]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService, RolesGuard],
})
export class CustomersModule {}
