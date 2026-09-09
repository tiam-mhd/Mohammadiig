import { IsBoolean, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManageCategoryDto {
  @ApiProperty({ example: 'تجهیزات' })
  @IsString()
  @Length(2, 100)
  nameFa!: string;

  @ApiProperty({ example: 'Equipment' })
  @IsString()
  @Length(2, 100)
  nameEn!: string;

  @ApiProperty({ example: 'equipment' })
  @IsString()
  @Length(2, 100)
  slug!: string;

  @ApiProperty({ example: 'توضیح کوتاه دسته' })
  @IsString()
  @Length(2, 2000)
  descriptionFa!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
