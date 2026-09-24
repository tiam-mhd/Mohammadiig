import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UserEntity, UserRole } from '../auth/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly users: Repository<UserEntity>) {}

  async findAll(page = 1, limit = 20, search = '') { const qb = this.users.createQueryBuilder('user').where('user.role != :customer', { customer: 'customer' }); if (search.trim()) qb.andWhere('(LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.phone) LIKE LOWER(:search) OR LOWER(user.first_name) LIKE LOWER(:search) OR LOWER(user.last_name) LIKE LOWER(:search))', { search: `%${search.trim()}%` }); const [data,total] = await qb.orderBy('user.created_at','DESC').skip((page-1)*limit).take(limit).getManyAndCount(); return { data, meta: { page, limit, total, totalPages: Math.ceil(total/limit) } }; }

  async updateRole(id: string, role: UserRole): Promise<UserEntity> { const user = await this.users.findOne({ where: { id } }); if (!user) throw new NotFoundException('User not found'); user.role = role; return this.users.save(user); }
  async updateActive(id: string, isActive: boolean): Promise<UserEntity> { const user = await this.users.findOne({ where: { id } }); if (!user) throw new NotFoundException('User not found'); user.isActive = isActive; return this.users.save(user); }
}
