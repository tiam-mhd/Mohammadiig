import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'attachments' })
export class AttachmentEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'owner_type', type: 'varchar', length: 50 }) ownerType!: 'Order' | 'Quotation' | 'Project' | 'Invoice' | 'ProjectPhase';
  @Column({ name: 'owner_id', type: 'varchar', length: 100 }) ownerId!: string;
  @Column({ name: 'file_name', type: 'varchar', length: 255 }) fileName!: string;
  @Column({ name: 'file_url', type: 'varchar', length: 500 }) fileUrl!: string;
  @Column({ name: 'file_size', type: 'integer', nullable: true }) fileSize!: number | null;
  @Column({ name: 'file_type', type: 'varchar', length: 50, nullable: true }) fileType!: string | null;
  @Column({ name: 'uploaded_by', type: 'varchar', length: 100 }) uploadedBy!: string;
  @CreateDateColumn({ name: 'uploaded_at' }) uploadedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
