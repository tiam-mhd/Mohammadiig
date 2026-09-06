import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/user.entity';
import { RolesGuard } from '../auth/roles.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({ imports: [TypeOrmModule.forFeature([UserEntity])], controllers: [UsersController], providers: [UsersService, RolesGuard] })
export class UsersModule {}
