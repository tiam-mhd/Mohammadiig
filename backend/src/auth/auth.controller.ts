import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CompletePasswordLoginDto,
  CompleteRegistrationDto,
  LoginDto,
  RegisterDto,
  RequestNewMobileDto,
  ResendOtpDto,
  ResetPasswordDto,
  SendOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { AuthResponse, AuthService, OtpSendResponse, OtpVerifyResponse } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Legacy email registration' })
  @ApiResponse({ status: 201, description: 'Account created' })
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password (admin / legacy)' })
  @ApiResponse({ status: 200, description: 'JWT issued' })
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Post('otp/send')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send OTP via Parsgreen for login/register/forgot/change-mobile' })
  sendOtp(@Body() dto: SendOtpDto): Promise<OtpSendResponse> {
    return this.authService.sendOtp(dto);
  }

  @Post('otp/resend')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend OTP after cooldown' })
  resendOtp(@Body() dto: ResendOtpDto): Promise<OtpSendResponse> {
    return this.authService.resendOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify OTP and advance to next auth step' })
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<OtpVerifyResponse> {
    return this.authService.verifyOtp(dto);
  }

  @Post('register/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Complete phone registration with first/last name' })
  completeRegistration(@Body() dto: CompleteRegistrationDto): Promise<AuthResponse> {
    return this.authService.completeRegistration(dto);
  }

  @Post('login/password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Complete 2FA login with password after OTP' })
  completePasswordLogin(@Body() dto: CompletePasswordLoginDto): Promise<AuthResponse> {
    return this.authService.completePasswordLogin(dto);
  }

  @Post('password/reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Set new password after forgot-password OTP' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<AuthResponse> {
    return this.authService.resetPassword(dto);
  }

  @Post('mobile/change/request')
  @HttpCode(200)
  @ApiOperation({ summary: 'After old-mobile OTP, send OTP to the new mobile' })
  requestNewMobile(@Body() dto: RequestNewMobileDto): Promise<OtpSendResponse> {
    return this.authService.requestNewMobile(dto);
  }
}
