import { ConflictException, Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserEntity } from './user.entity';
import { CustomerEntity } from '../customers/customer.entity';

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; role: string; companyName: string | null };
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultAdmin();
  }

  /** Creates the bootstrap admin when that email is missing (safe for PaaS deploys). */
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
      lastLoginAt: null,
    });
    this.logger.log(`Default admin created: ${email}`);
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.findOne({ where: { email } })) throw new ConflictException('Email already registered');
    const user = await this.users.save({
      id: randomUUID(), email, passwordHash: await hash(dto.password, 12), firstName: dto.firstName, lastName: dto.lastName,
      phone: dto.phone ?? null, companyName: dto.companyName, role: 'customer', isActive: true, lastLoginAt: null,
    });
    await this.customers.save({ id: randomUUID(), userId: user.id, companyName: dto.companyName, phone: dto.phone ?? null, contactPerson: `${dto.firstName} ${dto.lastName}`, isVerified: false });
    return this.createResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findOne({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !user.isActive || !(await compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    user.lastLoginAt = new Date().toISOString();
    await this.users.save(user);
    return this.createResponse(user);
  }

  private createResponse(user: UserEntity): AuthResponse {
    return {
      accessToken: this.jwtService.sign({ userId: user.id, email: user.email, role: user.role }),
      user: { id: user.id, email: user.email, role: user.role, companyName: user.companyName },
    };
  }
}
