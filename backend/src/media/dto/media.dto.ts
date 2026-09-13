import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMediaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  folder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;
}

export class CompressMediaDto {
  @ApiPropertyOptional({ description: 'replace original file, or save as a new library copy' })
  @IsOptional()
  @IsIn(['replace', 'copy'])
  mode?: 'replace' | 'copy';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(8000)
  maxWidth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(8000)
  maxHeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  convertToWebp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stripMetadata?: boolean;
}

export class UpdateMediaSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(8000)
  maxWidth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(8000)
  maxHeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  convertToWebp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stripMetadata?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  compressOnUpload?: boolean;
}

export class ListMediaQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({ description: 'include soft-deleted items' })
  @IsOptional()
  @IsIn(['active', 'trash', 'all'])
  status?: 'active' | 'trash' | 'all';

  @ApiPropertyOptional({ description: 'filter by media kind' })
  @IsOptional()
  @IsIn(['image', 'video', 'all'])
  kind?: 'image' | 'video' | 'all';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
