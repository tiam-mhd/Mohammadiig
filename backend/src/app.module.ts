import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { environmentValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database.module';
import { HealthController } from './health.controller';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { QuotationsModule } from './quotations/quotations.module';
import { OrdersModule } from './orders/orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { ProjectsModule } from './projects/projects.module';
import { ServicesModule } from './services/services.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validationSchema: environmentValidationSchema }),
    DatabaseModule,
    ProductsModule,
    AuthModule,
    CustomersModule,
    QuotationsModule,
    OrdersModule,
    InvoicesModule,
    PaymentsModule,
    ProjectsModule,
    ServicesModule,
    AttachmentsModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
