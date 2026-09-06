import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserEntity } from './user.entity';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CustomerEntity]),
    PassportModule,
    JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.get<string>('JWT_SECRET', 'mig-development-secret'), signOptions: { expiresIn: '1d' } }) }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, JwtStrategy, JwtModule, RolesGuard],
})
export class AuthModule {}
