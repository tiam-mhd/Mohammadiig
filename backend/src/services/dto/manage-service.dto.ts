import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManageServiceDto {
  @ApiProperty() @IsString() @Length(2, 150) nameFa!: string;
  @ApiProperty() @IsString() @Length(2, 150) nameEn!: string;
  @ApiProperty() @IsString() @Length(10, 2000) description!: string;
  @ApiProperty({ enum: ['installation', 'training', 'maintenance', 'support', 'customization', 'other'] }) @IsIn(['installation', 'training', 'maintenance', 'support', 'customization', 'other']) serviceCategory!: string;
  @ApiPropertyOptional({ description: 'قیمت اختیاری؛ خالی = بدون نمایش قیمت' })
  @IsOptional()
  @IsInt()
  @Min(0)
  basePrice?: number | null;
  @ApiProperty({ enum: ['per_hour', 'per_day', 'per_visit', 'per_unit', 'fixed'] }) @IsIn(['per_hour', 'per_day', 'per_visit', 'per_unit', 'fixed']) unitType!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
