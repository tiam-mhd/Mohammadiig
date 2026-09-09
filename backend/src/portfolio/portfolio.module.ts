import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioWorkEntity } from './portfolio-work.entity';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([PortfolioWorkEntity])],
  controllers: [PortfolioController],
  providers: [PortfolioService, RolesGuard],
  exports: [PortfolioService],
})
export class PortfolioModule {}
