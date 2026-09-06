import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../auth/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly users: Repository<UserEntity>) {}

  findAll(): Promise<UserEntity[]> { return this.users.find({ order: { createdAt: 'DESC' } }); }

  async updateRole(id: string, role: UserRole): Promise<UserEntity> { const user = await this.users.findOne({ where: { id } }); if (!user) throw new NotFoundException('User not found'); user.role = role; return this.users.save(user); }
  async updateActive(id: string, isActive: boolean): Promise<UserEntity> { const user = await this.users.findOne({ where: { id } }); if (!user) throw new NotFoundException('User not found'); user.isActive = isActive; return this.users.save(user); }
}
