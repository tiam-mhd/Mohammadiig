import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export type OtpPurpose =
  | 'register'
  | 'login'
  | 'forgot_password'
  | 'change_mobile_old'
  | 'change_mobile_new';

@Entity({ name: 'otp_challenges' })
export class OtpChallengeEntity {
  @PrimaryColumn('text') id!: string;

  @Index()
  @Column({ type: 'varchar', length: 20 }) phone!: string;

  @Column({ type: 'varchar', length: 40 }) purpose!: OtpPurpose;

  @Column({ name: 'code_hash', type: 'varchar', length: 255 }) codeHash!: string;

  @Column({ type: 'integer', default: 0 }) attempts!: number;

  @Column({ name: 'max_attempts', type: 'integer', default: 5 }) maxAttempts!: number;

  @Column({ name: 'expires_at', type: 'varchar', length: 40 }) expiresAt!: string;

  @Column({ name: 'resend_available_at', type: 'varchar', length: 40 }) resendAvailableAt!: string;

  @Column({ name: 'consumed_at', type: 'varchar', length: 40, nullable: true }) consumedAt!: string | null;

  /** Opaque token issued after successful OTP verify for the next step. */
  @Column({ name: 'step_token', type: 'varchar', length: 80, nullable: true }) stepToken!: string | null;

  @Column({ name: 'step_token_expires_at', type: 'varchar', length: 40, nullable: true }) stepTokenExpiresAt!: string | null;

  /** JSON blob for pending data (e.g. target new phone, userId). */
  @Column({ type: 'text', nullable: true }) meta!: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
