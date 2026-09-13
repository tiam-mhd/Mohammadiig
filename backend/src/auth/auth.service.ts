import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
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
import { UserEntity } from './user.entity';
import { CustomerEntity } from '../customers/customer.entity';
import { OtpChallengeEntity, OtpPurpose } from './otp-challenge.entity';
import { ParsgreenSmsService } from '../sms/parsgreen-sms.service';
import { maskMobile, normalizeIranMobile } from './phone.util';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    companyName: string | null;
    twoFactorEnabled: boolean;
  };
}

export interface OtpSendResponse {
  challengeId: string;
  phoneMasked: string;
  expiresIn: number;
  resendAfter: number;
  purpose: string;
  /** Only present in non-production when PARSGREEN_DEBUG=true */
  debugCode?: string;
}

export type OtpVerifyResponse =
  | ({ nextStep: 'done' } & AuthResponse)
  | { nextStep: 'password'; passwordToken: string; expiresIn: number }
  | { nextStep: 'profile'; registrationToken: string; expiresIn: number }
  | { nextStep: 'new_password'; resetToken: string; expiresIn: number }
  | { nextStep: 'new_mobile'; changeToken: string; expiresIn: number; phoneMasked: string };

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpTtlSec: number;
  private readonly resendCooldownSec: number;
  private readonly stepTokenTtlSec: number;
  private readonly otpLength: number;
  private readonly otpPepper: string;

  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
    @InjectRepository(OtpChallengeEntity) private readonly otps: Repository<OtpChallengeEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sms: ParsgreenSmsService,
  ) {
    this.otpTtlSec = Number(this.config.get('OTP_TTL_SECONDS') ?? 120);
    this.resendCooldownSec = Number(this.config.get('OTP_RESEND_SECONDS') ?? 60);
    this.stepTokenTtlSec = Number(this.config.get('OTP_STEP_TOKEN_SECONDS') ?? 600);
    this.otpLength = Number(this.config.get('OTP_LENGTH') ?? 5);
    this.otpPepper = this.config.get<string>('JWT_SECRET', 'mig-development-secret');
  }

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultAdmin();
  }

  async ensureDefaultAdmin(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL', 'admin@mohammadiig.ir').trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD', 'MigAdmin2026!');
    const firstName = this.config.get<string>('ADMIN_FIRST_NAME', 'MIG');
    const lastName = this.config.get<string>('ADMIN_LAST_NAME', 'Admin');

    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      if (existing.role !== 'admin' || !existing.isActive) {
        existing.role = 'admin';
        existing.isActive = true;
        await this.users.save(existing);
        this.logger.log(`Ensured admin role for existing user ${email}`);
      }
      return;
    }

    await this.users.save({
      id: randomUUID(),
      email,
      passwordHash: await hash(password, 12),
      firstName,
      lastName,
      phone: null,
      companyName: 'MIG Industrial Group',
      role: 'admin',
      isActive: true,
      twoFactorEnabled: false,
      lastLoginAt: null,
    });
    this.logger.log(`Default admin created: ${email}`);
  }

  /** Legacy email registration (kept for admin tooling / backward compat). */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.findOne({ where: { email } })) throw new ConflictException('این ایمیل قبلاً ثبت شده است.');
    const phone = dto.phone ? normalizeIranMobile(dto.phone) : null;
    if (dto.phone && !phone) throw new BadRequestException('شماره موبایل معتبر نیست.');
    if (phone && (await this.users.findOne({ where: { phone } }))) {
      throw new ConflictException('این شماره موبایل قبلاً ثبت شده است.');
    }
    const user = await this.users.save({
      id: randomUUID(),
      email,
      passwordHash: await hash(dto.password, 12),
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone,
      companyName: dto.companyName,
      role: 'customer',
      isActive: true,
      twoFactorEnabled: false,
      lastLoginAt: null,
    });
    await this.customers.save({
      id: randomUUID(),
      userId: user.id,
      companyName: dto.companyName,
      phone,
      contactPerson: `${dto.firstName} ${dto.lastName}`,
      isVerified: false,
    });
    return this.createResponse(user);
  }

  /** Admin / email-password login. */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findOne({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user?.passwordHash || !user.isActive || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است.');
    }
    return this.issueLogin(user);
  }

  async sendOtp(dto: SendOtpDto): Promise<OtpSendResponse> {
    const phone = normalizeIranMobile(dto.phone);
    if (!phone) throw new BadRequestException('شماره موبایل معتبر نیست. مثال: 09121234567');

    const existing = await this.users.findOne({ where: { phone } });

    let purpose: OtpPurpose;
    let meta: Record<string, unknown> | null = null;

    switch (dto.purpose) {
      case 'register':
        if (existing) throw new ConflictException('این شماره قبلاً ثبت‌نام کرده است. وارد شوید.');
        purpose = 'register';
        break;
      case 'login':
        if (!existing || !existing.isActive) {
          throw new UnauthorizedException('حسابی با این شماره یافت نشد. ابتدا ثبت‌نام کنید.');
        }
        if (existing.role === 'admin') {
          throw new BadRequestException('حساب مدیریت از این صفحه وارد نمی‌شود.');
        }
        purpose = 'login';
        meta = { userId: existing.id, twoFactorEnabled: existing.twoFactorEnabled };
        break;
      case 'forgot_password':
        if (!existing || !existing.isActive) {
          throw new UnauthorizedException('حسابی با این شماره یافت نشد.');
        }
        if (!existing.passwordHash && !existing.twoFactorEnabled) {
          throw new BadRequestException('برای این حساب هنوز رمزی تنظیم نشده است.');
        }
        purpose = 'forgot_password';
        meta = { userId: existing.id };
        break;
      case 'change_mobile':
        if (!existing || !existing.isActive) {
          throw new UnauthorizedException('حسابی با این شماره یافت نشد.');
        }
        purpose = 'change_mobile_old';
        meta = { userId: existing.id, oldPhone: phone };
        break;
      default:
        throw new BadRequestException('نوع درخواست نامعتبر است.');
    }

    return this.createAndSendChallenge(phone, purpose, meta);
  }

  async resendOtp(dto: ResendOtpDto): Promise<OtpSendResponse> {
    const challenge = await this.otps.findOne({ where: { id: dto.challengeId } });
    if (!challenge || challenge.consumedAt) {
      throw new BadRequestException('درخواست کد معتبر نیست. دوباره شروع کنید.');
    }
    const now = Date.now();
    if (now < Date.parse(challenge.resendAvailableAt)) {
      const wait = Math.ceil((Date.parse(challenge.resendAvailableAt) - now) / 1000);
      throw new HttpException(`ارسال مجدد تا ${wait} ثانیه دیگر امکان‌پذیر نیست.`, HttpStatus.TOO_MANY_REQUESTS);
    }
    // Invalidate previous challenge and issue a fresh one with same purpose/meta.
    challenge.consumedAt = new Date().toISOString();
    await this.otps.save(challenge);
    const meta = challenge.meta ? (JSON.parse(challenge.meta) as Record<string, unknown>) : null;
    return this.createAndSendChallenge(challenge.phone, challenge.purpose, meta);
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<OtpVerifyResponse> {
    const challenge = await this.requireActiveChallenge(dto.challengeId);
    const code = dto.code.trim();
    if (challenge.attempts >= challenge.maxAttempts) {
      throw new HttpException('تعداد تلاش بیش از حد مجاز است. دوباره کد بگیرید.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const ok = this.hashOtp(code, challenge.id) === challenge.codeHash;
    challenge.attempts += 1;
    if (!ok) {
      await this.otps.save(challenge);
      const left = challenge.maxAttempts - challenge.attempts;
      throw new UnauthorizedException(
        left > 0 ? `کد نادرست است. ${left} تلاش باقی مانده.` : 'کد نادرست است. دوباره کد بگیرید.',
      );
    }

    challenge.consumedAt = new Date().toISOString();
    const stepToken = this.newToken();
    challenge.stepToken = stepToken;
    challenge.stepTokenExpiresAt = this.isoAfter(this.stepTokenTtlSec);
    await this.otps.save(challenge);

    const meta = challenge.meta ? (JSON.parse(challenge.meta) as Record<string, unknown>) : {};

    switch (challenge.purpose) {
      case 'login': {
        const user = await this.users.findOne({ where: { id: String(meta.userId) } });
        if (!user || !user.isActive) throw new UnauthorizedException('حساب کاربری فعال نیست.');
        if (user.twoFactorEnabled) {
          return { nextStep: 'password', passwordToken: stepToken, expiresIn: this.stepTokenTtlSec };
        }
        return { nextStep: 'done', ...(await this.issueLogin(user)) };
      }
      case 'register':
        return { nextStep: 'profile', registrationToken: stepToken, expiresIn: this.stepTokenTtlSec };
      case 'forgot_password':
        return { nextStep: 'new_password', resetToken: stepToken, expiresIn: this.stepTokenTtlSec };
      case 'change_mobile_old':
        return {
          nextStep: 'new_mobile',
          changeToken: stepToken,
          expiresIn: this.stepTokenTtlSec,
          phoneMasked: maskMobile(challenge.phone),
        };
      case 'change_mobile_new': {
        const userId = String(meta.userId);
        const newPhone = challenge.phone;
        const user = await this.users.findOne({ where: { id: userId } });
        if (!user || !user.isActive) throw new UnauthorizedException('حساب کاربری فعال نیست.');
        const taken = await this.users.findOne({ where: { phone: newPhone } });
        if (taken && taken.id !== user.id) {
          throw new ConflictException('این شماره قبلاً توسط حساب دیگری استفاده شده است.');
        }
        user.phone = newPhone;
        await this.users.save(user);
        const customer = await this.customers.findOne({ where: { userId: user.id } });
        if (customer) {
          customer.phone = newPhone;
          await this.customers.save(customer);
        }
        return { nextStep: 'done', ...(await this.issueLogin(user)) };
      }
      default:
        throw new BadRequestException('نوع درخواست نامعتبر است.');
    }
  }

  async completeRegistration(dto: CompleteRegistrationDto): Promise<AuthResponse> {
    const challenge = await this.requireStepToken(dto.registrationToken, 'register');
    const phone = challenge.phone;
    if (await this.users.findOne({ where: { phone } })) {
      throw new ConflictException('این شماره قبلاً ثبت‌نام کرده است.');
    }
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const user = await this.users.save({
      id: randomUUID(),
      email: null,
      passwordHash: null,
      firstName,
      lastName,
      phone,
      companyName: null,
      role: 'customer',
      isActive: true,
      twoFactorEnabled: false,
      lastLoginAt: null,
    });
    await this.customers.save({
      id: randomUUID(),
      userId: user.id,
      companyName: null,
      phone,
      contactPerson: `${firstName} ${lastName}`,
      isVerified: false,
    });
    challenge.stepToken = null;
    challenge.stepTokenExpiresAt = null;
    await this.otps.save(challenge);
    return this.issueLogin(user);
  }

  async completePasswordLogin(dto: CompletePasswordLoginDto): Promise<AuthResponse> {
    const challenge = await this.requireStepToken(dto.passwordToken, 'login');
    const meta = challenge.meta ? (JSON.parse(challenge.meta) as Record<string, unknown>) : {};
    const user = await this.users.findOne({ where: { id: String(meta.userId) } });
    if (!user?.passwordHash || !user.isActive || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('رمز عبور نادرست است.');
    }
    challenge.stepToken = null;
    challenge.stepTokenExpiresAt = null;
    await this.otps.save(challenge);
    return this.issueLogin(user);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<AuthResponse> {
    const challenge = await this.requireStepToken(dto.resetToken, 'forgot_password');
    const meta = challenge.meta ? (JSON.parse(challenge.meta) as Record<string, unknown>) : {};
    const user = await this.users.findOne({ where: { id: String(meta.userId) } });
    if (!user || !user.isActive) throw new UnauthorizedException('حساب کاربری فعال نیست.');
    user.passwordHash = await hash(dto.newPassword, 12);
    // Setting a password enables 2FA login path if they already had it, or they can enable later.
    await this.users.save(user);
    challenge.stepToken = null;
    challenge.stepTokenExpiresAt = null;
    await this.otps.save(challenge);
    return this.issueLogin(user);
  }

  async requestNewMobile(dto: RequestNewMobileDto): Promise<OtpSendResponse> {
    const oldChallenge = await this.requireStepToken(dto.changeToken, 'change_mobile_old');
    const newPhone = normalizeIranMobile(dto.newPhone);
    if (!newPhone) throw new BadRequestException('شماره موبایل جدید معتبر نیست.');
    if (newPhone === oldChallenge.phone) {
      throw new BadRequestException('شماره جدید باید با شماره فعلی متفاوت باشد.');
    }
    const meta = oldChallenge.meta ? (JSON.parse(oldChallenge.meta) as Record<string, unknown>) : {};
    const userId = String(meta.userId);
    const taken = await this.users.findOne({ where: { phone: newPhone } });
    if (taken && taken.id !== userId) {
      throw new ConflictException('این شماره قبلاً ثبت شده است.');
    }
    // Consume old step token so it cannot be reused.
    oldChallenge.stepToken = null;
    oldChallenge.stepTokenExpiresAt = null;
    await this.otps.save(oldChallenge);

    return this.createAndSendChallenge(newPhone, 'change_mobile_new', {
      userId,
      oldPhone: oldChallenge.phone,
    });
  }

  private async createAndSendChallenge(
    phone: string,
    purpose: OtpPurpose,
    meta: Record<string, unknown> | null,
  ): Promise<OtpSendResponse> {
    const lastOpen = await this.otps.find({
      where: { phone, purpose },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    const last = lastOpen[0];
    if (last && !last.consumedAt && Date.now() < Date.parse(last.resendAvailableAt)) {
      const wait = Math.ceil((Date.parse(last.resendAvailableAt) - Date.now()) / 1000);
      throw new HttpException(`لطفاً ${wait} ثانیه صبر کنید و دوباره تلاش کنید.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const challengeId = randomUUID();
    const code = this.generateOtpCode();
    const now = Date.now();
    const challenge = await this.otps.save({
      id: challengeId,
      phone,
      purpose,
      codeHash: this.hashOtp(code, challengeId),
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(now + this.otpTtlSec * 1000).toISOString(),
      resendAvailableAt: new Date(now + this.resendCooldownSec * 1000).toISOString(),
      consumedAt: null,
      stepToken: null,
      stepTokenExpiresAt: null,
      meta: meta ? JSON.stringify(meta) : null,
    });

    await this.sms.sendOtp(phone, code);

    const response: OtpSendResponse = {
      challengeId: challenge.id,
      phoneMasked: maskMobile(phone),
      expiresIn: this.otpTtlSec,
      resendAfter: this.resendCooldownSec,
      purpose,
    };

    if (this.config.get('PARSGREEN_DEBUG') === 'true') {
      response.debugCode = code;
    }

    return response;
  }

  private async requireActiveChallenge(challengeId: string): Promise<OtpChallengeEntity> {
    const challenge = await this.otps.findOne({ where: { id: challengeId } });
    if (!challenge || challenge.consumedAt) {
      throw new BadRequestException('کد منقضی یا نامعتبر است. دوباره درخواست دهید.');
    }
    if (Date.now() > Date.parse(challenge.expiresAt)) {
      challenge.consumedAt = new Date().toISOString();
      await this.otps.save(challenge);
      throw new BadRequestException('مهلت ورود کد به پایان رسیده است. دوباره درخواست دهید.');
    }
    return challenge;
  }

  private async requireStepToken(token: string, purpose: OtpPurpose): Promise<OtpChallengeEntity> {
    const challenge = await this.otps.findOne({ where: { stepToken: token, purpose } });
    if (!challenge?.stepTokenExpiresAt || Date.now() > Date.parse(challenge.stepTokenExpiresAt)) {
      throw new BadRequestException('نشست تأیید منقضی شده است. دوباره شروع کنید.');
    }
    return challenge;
  }

  private async issueLogin(user: UserEntity): Promise<AuthResponse> {
    user.lastLoginAt = new Date().toISOString();
    await this.users.save(user);
    return this.createResponse(user);
  }

  private createResponse(user: UserEntity): AuthResponse {
    return {
      accessToken: this.jwtService.sign({
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyName: user.companyName,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  private generateOtpCode(): string {
    const max = 10 ** this.otpLength;
    const min = 10 ** (this.otpLength - 1);
    return String(randomInt(min, max));
  }

  private hashOtp(code: string, challengeId: string): string {
    return createHash('sha256').update(`${this.otpPepper}:${challengeId}:${code}`).digest('hex');
  }

  private newToken(): string {
    return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').slice(0, 16);
  }

  private isoAfter(seconds: number): string {
    return new Date(Date.now() + seconds * 1000).toISOString();
  }
}
