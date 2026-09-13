import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { MediaController } from './media.controller';
import { MediaAssetEntity } from './media.entity';
import { MediaService } from './media.service';

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([MediaAssetEntity])],
  controllers: [MediaController],
  providers: [MediaService, RolesGuard],
  exports: [MediaService],
})
export class MediaModule {}
