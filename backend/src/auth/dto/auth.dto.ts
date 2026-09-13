import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const OTP_CODE = /^\d{4,8}$/;

export class RegisterDto {
  @ApiProperty() @IsString() @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) email!: string;
  @ApiProperty({ minLength: 8 }) @IsString() @Length(8, 128) password!: string;
  @ApiProperty() @IsString() @Length(2, 100) firstName!: string;
  @ApiProperty() @IsString() @Length(2, 100) lastName!: string;
  @ApiProperty() @IsString() @Length(2, 255) companyName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^[0-9+()\-\s]{7,20}$/) phone?: string;
}

export class LoginDto {
  @ApiProperty() @IsString() @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) email!: string;
  @ApiProperty() @IsString() @Length(8, 128) password!: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '09121234567' })
  @IsString()
  phone!: string;

  @ApiProperty({ enum: ['login', 'register', 'forgot_password', 'change_mobile'] })
  @IsIn(['login', 'register', 'forgot_password', 'change_mobile'])
  purpose!: 'login' | 'register' | 'forgot_password' | 'change_mobile';
}

export class ResendOtpDto {
  @ApiProperty() @IsString() @MinLength(8) challengeId!: string;
}

export class VerifyOtpDto {
  @ApiProperty() @IsString() @MinLength(8) challengeId!: string;
  @ApiProperty({ example: '12345' }) @IsString() @Matches(OTP_CODE) code!: string;
}

export class CompleteRegistrationDto {
  @ApiProperty() @IsString() @MinLength(16) registrationToken!: string;
  @ApiProperty() @IsString() @Length(2, 100) firstName!: string;
  @ApiProperty() @IsString() @Length(2, 100) lastName!: string;
}

export class CompletePasswordLoginDto {
  @ApiProperty() @IsString() @MinLength(16) passwordToken!: string;
  @ApiProperty() @IsString() @Length(8, 128) password!: string;
}

export class ResetPasswordDto {
  @ApiProperty() @IsString() @MinLength(16) resetToken!: string;
  @ApiProperty() @IsString() @Length(8, 128) newPassword!: string;
}

export class RequestNewMobileDto {
  @ApiProperty() @IsString() @MinLength(16) changeToken!: string;
  @ApiProperty({ example: '09121234567' }) @IsString() newPhone!: string;
}
