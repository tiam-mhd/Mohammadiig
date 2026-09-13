import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'media_assets' })
export class MediaAssetEntity {
  @PrimaryColumn('text')
  id!: string;

  /** Original upload filename (display). */
  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName!: string;

  /** Filename on disk. */
  @Column({ name: 'stored_name', type: 'varchar', length: 255 })
  storedName!: string;

  /** Path relative to MEDIA_ROOT, e.g. 2026/09/uuid.webp */
  @Column({ name: 'relative_path', type: 'varchar', length: 500 })
  relativePath!: string;

  /** Public URL path, e.g. /media/2026/09/uuid.webp */
  @Column({ name: 'url', type: 'varchar', length: 700 })
  url!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType!: string;

  @Column({ name: 'file_size', type: 'integer' })
  fileSize!: number;

  @Column({ type: 'integer', nullable: true })
  width!: number | null;

  @Column({ type: 'integer', nullable: true })
  height!: number | null;

  /** Logical folder for library browsing (not filesystem). */
  @Column({ type: 'varchar', length: 120, default: 'general' })
  folder!: string;

  /** SEO / accessibility */
  @Column({ name: 'alt_text', type: 'varchar', length: 300, nullable: true })
  altText!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  caption!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum!: string | null;

  /** If this asset was created as a compressed copy of another. */
  @Column({ name: 'parent_id', type: 'varchar', length: 100, nullable: true })
  parentId!: string | null;

  @Column({ name: 'uploaded_by', type: 'varchar', length: 100 })
  uploadedBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
