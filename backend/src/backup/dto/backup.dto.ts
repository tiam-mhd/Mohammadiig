import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { ALL_DATASET_KEYS, BackupDatasetKey, RestoreConflictMode } from '../backup.datasets';

export class ExportBackupDto {
  @ApiPropertyOptional({
    description: 'Dataset keys to include. Omit or pass ["all"] for everything.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  datasets?: string[];

  @ApiPropertyOptional({ description: 'Include soft-deleted rows', default: true })
  @IsOptional()
  @IsBoolean()
  includeSoftDeleted?: boolean;

  @ApiPropertyOptional({
    description: 'When media dataset is selected, pack binary files into the ZIP',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeMediaFiles?: boolean;
}

export class RestoreBackupOptionsDto {
  @ApiPropertyOptional({
    description: 'Datasets to restore from the archive. Omit to restore all present in the file.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  datasets?: string[];

  @ApiProperty({
    enum: ['skip', 'overwrite', 'replace'],
    description:
      'skip = keep existing IDs; overwrite = update existing IDs; replace = wipe selected datasets then import',
  })
  @IsIn(['skip', 'overwrite', 'replace'])
  mode!: RestoreConflictMode;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: 'Restore media binary files when media dataset is included',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  restoreMediaFiles?: boolean;

  @ApiPropertyOptional({
    description: 'Do not overwrite the currently logged-in admin user row',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  protectCurrentAdmin?: boolean;
}

export function normalizeDatasetSelection(raw: string[] | undefined): BackupDatasetKey[] | 'all' {
  if (!raw || raw.length === 0) return 'all';
  if (raw.length === 1 && raw[0] === 'all') return 'all';
  const allowed = new Set<string>(ALL_DATASET_KEYS);
  const keys = raw.filter((k): k is BackupDatasetKey => allowed.has(k));
  return keys.length ? keys : 'all';
}
