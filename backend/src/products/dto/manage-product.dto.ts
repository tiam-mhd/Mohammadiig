import { IsBoolean, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManageProductDto {
  @ApiProperty() @IsString() @Length(2, 200) nameFa!: string;
  @ApiProperty() @IsString() @Length(2, 200) nameEn!: string;
  @ApiProperty() @IsString() @Length(2, 200) slug!: string;
  @ApiProperty() @IsString() @Length(10, 500) descriptionShortFa!: string;
  @ApiProperty() @IsString() @Length(2, 50) sku!: string;
  @ApiProperty() @IsString() @Length(2, 40) category!: string;
  @ApiProperty() @IsInt() @Min(0) priceBase!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailImageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
}
