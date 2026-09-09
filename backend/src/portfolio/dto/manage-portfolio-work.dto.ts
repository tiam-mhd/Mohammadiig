import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManagePortfolioWorkDto {
  @ApiProperty({ example: 'سالن-ماشین-برخوردی-تهران' })
  @IsString()
  @Length(2, 120)
  slug!: string;

  @ApiProperty({ example: 'سالن ماشین برخوردی تهران' })
  @IsString()
  @Length(2, 200)
  titleFa!: string;

  @ApiProperty({ example: 'Tehran Bumper Cars Hall' })
  @IsString()
  @Length(2, 200)
  titleEn!: string;

  @ApiProperty({ example: 'راه‌اندازی کامل سالن برای یک مجموعه خانوادگی.' })
  @IsString()
  @Length(2, 500)
  summaryFa!: string;

  @ApiProperty()
  @IsString()
  @Length(10, 8000)
  descriptionFa!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  clientName?: string;

  @ApiPropertyOptional({ example: 'entertainment' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  workCategory?: string;

  @ApiPropertyOptional({ example: 'ایران' })
  @IsOptional()
  @IsString()
  @Length(0, 80)
  country?: string;

  @ApiPropertyOptional({ example: 'تهران' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  province?: string;

  @ApiPropertyOptional({ example: 'تهران' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;

  @ApiPropertyOptional({ example: 'منطقه ۲، مجموعه تفریحی …' })
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
  endDate?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  areaOrCapacity?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
