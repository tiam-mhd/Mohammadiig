import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class SparePartSpecDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  key!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 500)
  value!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 50)
  unit?: string;
}

export class ManageSparePartDto {
  @ApiProperty({ example: 'MIG-SP-MOTOR-A' })
  @IsString()
  @Length(2, 50)
  partNumber!: string;

  @ApiPropertyOptional({ example: 'mig-sp-motor-a' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  slug?: string;

  @ApiProperty({ example: 'موتور محرک سری A' })
  @IsString()
  @Length(2, 150)
  nameFa!: string;

  @ApiProperty({ example: 'Drive Motor A' })
  @IsString()
  @Length(2, 150)
  nameEn!: string;

  @ApiProperty({ example: 'موتور یدکی سازگار با تجهیزات MIG.' })
  @IsString()
  @Length(2, 2000)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  shortDescription?: string;

  @ApiProperty({ example: 'motors' })
  @IsString()
  @Length(1, 100)
  category!: string;

  @ApiPropertyOptional({ type: [String], example: ['1', '2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleProducts?: string[];

  @ApiProperty({ example: 3500000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ description: 'قیمت توافقی — بدون نمایش مبلغ ریالی' })
  @IsOptional()
  @IsBoolean()
  priceNegotiable?: boolean;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  oemCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  weightGrams?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 120)
  dimensions?: string;

  @ApiPropertyOptional({ type: [SparePartSpecDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SparePartSpecDto)
  specs?: SparePartSpecDto[];

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Partial update — for full editor saves and quick stock/price edits */
export class PatchSparePartDto extends PartialType(ManageSparePartDto) {}
