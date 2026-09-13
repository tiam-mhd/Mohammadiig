import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'customers' })
export class CustomerEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'user_id', type: 'varchar', unique: true }) userId!: string;
  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true }) companyName!: string | null;
  @Column({ name: 'company_registration_number', type: 'varchar', length: 50, nullable: true }) companyRegistrationNumber!: string | null;
  @Column({ name: 'company_website', type: 'varchar', length: 255, nullable: true }) companyWebsite!: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) industry!: string | null;
  @Column({ type: 'varchar', length: 50, nullable: true }) country!: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) city!: string | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) address!: string | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) phone!: string | null;
  @Column({ name: 'contact_person', type: 'varchar', length: 100, nullable: true }) contactPerson!: string | null;
  @Column({ name: 'payment_terms', type: 'varchar', length: 50, default: 'net_30' }) paymentTerms!: string;
  @Column({ name: 'credit_limit', type: 'integer', default: 0 }) creditLimit!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'is_verified', type: 'boolean', default: false }) isVerified!: boolean;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
