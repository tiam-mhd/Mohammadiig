import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { InvoiceEntity } from '../invoices/invoice.entity';
import { PaymentEntity } from './payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([PaymentEntity, InvoiceEntity, CustomerEntity])],
  controllers: [PaymentsController],
  providers: [PaymentsService, RolesGuard],
})
export class PaymentsModule {}
