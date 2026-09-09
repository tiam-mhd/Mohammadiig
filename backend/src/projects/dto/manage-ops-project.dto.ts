import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManageOpsProjectDto {
  @ApiProperty({ example: 'بهره‌برداری سالن اصفهان' })
  @IsString()
  @Length(2, 200)
  projectName!: string;

  @ApiPropertyOptional({ example: 'Isfahan Hall Operation' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  nameEn?: string;

  @ApiProperty({ example: 'isfahan-hall-operation' })
  @IsString()
  @Length(2, 120)
  slug!: string;

  @ApiProperty()
  @IsString()
  @Length(10, 8000)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  summaryFa?: string;

  @ApiProperty({ enum: ['operation', 'partnership', 'investment'] })
  @IsIn(['operation', 'partnership', 'investment'])
  projectType!: string;

  @ApiPropertyOptional({ example: 'شریک تجاری نمونه' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  clientDisplayName?: string;

  @ApiPropertyOptional({ example: 'ایران' })
  @IsOptional()
  @IsString()
  @Length(0, 80)
  country?: string;

  @ApiPropertyOptional({ example: 'اصفهان' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  province?: string;

  @ApiPropertyOptional({ example: 'اصفهان' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  locationDetail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedCompletionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  completionDate?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetTotal?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  migInvestmentPercentage?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  profitSharingPercentage?: number;

  @ApiPropertyOptional({ enum: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'] })
  @IsOptional()
  @IsIn(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
