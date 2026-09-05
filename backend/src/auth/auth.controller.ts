import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthResponse, AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a B2B customer account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  register(@Body() dto: RegisterDto): Promise<AuthResponse> { return this.authService.register(dto); }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'JWT issued' })
  login(@Body() dto: LoginDto): Promise<AuthResponse> { return this.authService.login(dto); }
}
