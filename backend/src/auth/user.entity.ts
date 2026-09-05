import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type UserRole = 'admin' | 'salesman' | 'customer' | 'support' | 'accountant';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ type: 'varchar', length: 255, unique: true }) email!: string;
  @Column({ name: 'password_hash', type: 'varchar', length: 255 }) passwordHash!: string;
  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true }) firstName!: string | null;
  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true }) lastName!: string | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) phone!: string | null;
  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true }) companyName!: string | null;
  @Column({ type: 'varchar', length: 50, default: 'customer' }) role!: UserRole;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;
  @Column({ name: 'last_login_at', type: 'varchar', length: 40, nullable: true }) lastLoginAt!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
