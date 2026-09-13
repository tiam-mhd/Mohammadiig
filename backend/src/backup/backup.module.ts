import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

@Module({
  imports: [PassportModule],
  controllers: [BackupController],
  providers: [BackupService, RolesGuard],
})
export class BackupModule {}
