import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseOptions } from './database.options';
import { ProductEntity } from './products/product.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions),
    TypeOrmModule.forFeature([ProductEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
