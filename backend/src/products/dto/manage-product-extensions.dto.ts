import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export const PRODUCT_SPEC_CATEGORIES = ['technical', 'appearance'] as const;
export type ProductSpecCategory = (typeof PRODUCT_SPEC_CATEGORIES)[number];

export class ManageProductSpecificationDto {
  @ApiProperty({ example: 'توان موتور' })
  @IsString()
  @Length(1, 100)
  specificationKey!: string;

  @ApiProperty({ example: '۲.۵' })
  @IsString()
  @Length(0, 255)
  specificationValue!: string;

  @ApiPropertyOptional({ example: 'کیلووات' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  unit?: string | null;

  @ApiProperty({ enum: PRODUCT_SPEC_CATEGORIES })
  @IsIn(PRODUCT_SPEC_CATEGORIES)
  specCategory!: ProductSpecCategory;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class ReorderProductSpecificationsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  orderedIds!: string[];
}

export class CopyProductSpecsDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  sourceProductId!: string;

  @ApiProperty({ enum: PRODUCT_SPEC_CATEGORIES, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsIn(PRODUCT_SPEC_CATEGORIES, { each: true })
  categories!: ProductSpecCategory[];
}

export class ManageProductVariantDto {
  @ApiProperty({ example: 'MIG-BC-STD' })
  @IsString()
  @Length(2, 50)
  skuVariant!: string;

  @ApiProperty({ example: 'استاندارد' })
  @IsString()
  @Length(2, 100)
  variantNameFa!: string;

  @ApiProperty({ example: 'Standard' })
  @IsString()
  @Length(2, 100)
  variantNameEn!: string;

  @ApiPropertyOptional({ example: 'STD' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  variantCode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  priceBase?: number | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  priceAdjustment?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stockQuantity?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
