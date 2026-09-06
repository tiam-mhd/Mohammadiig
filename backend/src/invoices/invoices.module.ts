import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { InvoiceEntity } from './invoice.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([InvoiceEntity, CustomerEntity])],
  controllers: [InvoicesController],
  providers: [InvoicesService, RolesGuard],
})
export class InvoicesModule {}
