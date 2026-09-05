import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { InvoiceEntity } from './invoice.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([InvoiceEntity, CustomerEntity])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
