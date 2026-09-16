import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class ManageSparePartDto {
  @ApiProperty({ example: 'MIG-SP-MOTOR-A' })
  @IsString()
  @Length(2, 50)
  partNumber!: string;

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
