import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { ParsgreenSmsService } from '../sms/parsgreen-sms.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { OtpChallengeEntity } from './otp-challenge.entity';
import { UserEntity } from './user.entity';
import { RolesGuard } from './roles.guard';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { SessionInterceptor } from './session.interceptor';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CustomerEntity, OtpChallengeEntity]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'mig-development-secret-change-in-production-32'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController, SessionController],
  providers: [AuthService, JwtStrategy, RolesGuard, ParsgreenSmsService, SessionService, SessionInterceptor],
  exports: [AuthService, JwtStrategy, JwtModule, RolesGuard, SessionService],
})
export class AuthModule {}
