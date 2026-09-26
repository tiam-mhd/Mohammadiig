import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { UserEntity, UserRole } from "../auth/user.entity";
import { AuditActor, AuditService } from "../audit/audit.service";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async findAll(page = 1, limit = 20, search = "") {
    const qb = this.users
      .createQueryBuilder("user")
      .where("user.role != :customer", { customer: "customer" });
    if (search.trim())
      qb.andWhere(
        "(LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.phone) LIKE LOWER(:search) OR LOWER(user.first_name) LIKE LOWER(:search) OR LOWER(user.last_name) LIKE LOWER(:search))",
        { search: `%${search.trim()}%` },
      );
    const [data, total] = await qb
      .orderBy("user.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    if (process.env.DB_DRIVER === "sqlite") return data;
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateRole(
    id: string,
    role: UserRole,
    actor?: AuditActor,
  ): Promise<UserEntity> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException("کاربر پیدا نشد");
    const previous = user.role;
    user.role = role;
    const saved = await this.users.save(user);
    if (actor && previous !== role)
      await AuditService.record(
        this.users.manager,
        actor,
        "user.role_changed",
        "user",
        id,
        { role: previous },
        { role },
      );
    return saved;
  }
  async updateActive(
    id: string,
    isActive: boolean,
    actor?: AuditActor,
  ): Promise<UserEntity> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException("کاربر پیدا نشد");
    const previous = user.isActive;
    user.isActive = isActive;
    const saved = await this.users.save(user);
    if (actor && previous !== isActive)
      await AuditService.record(
        this.users.manager,
        actor,
        "user.active_changed",
        "user",
        id,
        { isActive: previous },
        { isActive },
      );
    return saved;
  }
}
