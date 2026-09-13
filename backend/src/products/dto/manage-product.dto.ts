import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManageProductDto {
  /** Required: product title */
  @ApiProperty() @IsString() @Length(2, 200) nameFa!: string;

  /** Required: public URL slug */
  @ApiProperty() @IsString() @Length(2, 200) slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  descriptionShortFa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 8000)
  descriptionLongFa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 50)
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 40)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceBase?: number;

  /** @deprecated prefer images — kept for backward compatibility */
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailImageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Type(() => String)
  images?: string[];

  /** false = draft, true = published */
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
}
