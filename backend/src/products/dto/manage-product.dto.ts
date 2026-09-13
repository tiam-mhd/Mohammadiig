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
  @ApiProperty() @IsString() @Length(2, 200) nameFa!: string;
  @ApiProperty() @IsString() @Length(2, 200) nameEn!: string;
  @ApiProperty() @IsString() @Length(2, 200) slug!: string;
  @ApiProperty() @IsString() @Length(10, 500) descriptionShortFa!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 8000)
  descriptionLongFa?: string;
  @ApiProperty() @IsString() @Length(2, 50) sku!: string;
  @ApiProperty() @IsString() @Length(2, 40) category!: string;
  @ApiProperty() @IsInt() @Min(0) priceBase!: number;
  /** @deprecated prefer images — kept for backward compatibility */
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailImageUrl?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Type(() => String)
  images?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
}
