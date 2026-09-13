import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuotationRequestItemDto {
  @ApiProperty({ description: 'شناسه محصول' })
  @IsString({ message: 'شناسه محصول نامعتبر است.' })
  @IsNotEmpty({ message: 'شناسه محصول الزامی است.' })
  productId!: string;

  @ApiProperty({ minimum: 1, maximum: 999, description: 'تعداد' })
  @Type(() => Number)
  @IsInt({ message: 'تعداد باید عدد صحیح باشد.' })
  @Min(1, { message: 'تعداد هر محصول حداقل ۱ است.' })
  @Max(999, { message: 'تعداد هر محصول حداکثر ۹۹۹ است.' })
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject({ message: 'اطلاعات سفارشی‌سازی نامعتبر است.' })
  customizations?: Record<string, string>;
}

export class RequestQuotationDto {
  @ApiProperty({ type: [QuotationRequestItemDto] })
  @IsArray({ message: 'فهرست محصولات نامعتبر است.' })
  @ArrayMinSize(1, { message: 'حداقل یک محصول انتخاب کنید.' })
  @ValidateNested({ each: true })
  @Type(() => QuotationRequestItemDto)
  items!: QuotationRequestItemDto[];

  @ApiPropertyOptional({ description: 'توضیحات آزاد مشتری' })
  @IsOptional()
  @IsString({ message: 'توضیحات باید متن باشد.' })
  @MaxLength(2000, { message: 'توضیحات حداکثر ۲۰۰۰ کاراکتر است.' })
  notes?: string;

  @ApiPropertyOptional({ description: 'شهر یا محل پروژه' })
  @IsOptional()
  @IsString({ message: 'شهر پروژه نامعتبر است.' })
  @MaxLength(100, { message: 'نام شهر حداکثر ۱۰۰ کاراکتر است.' })
  projectCity?: string;

  @ApiPropertyOptional({ description: 'شماره تماس برای پیگیری' })
  @IsOptional()
  @IsString({ message: 'شماره تماس نامعتبر است.' })
  @MaxLength(30, { message: 'شماره تماس حداکثر ۳۰ کاراکتر است.' })
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'ابعاد سالن یا جزئیات فضا' })
  @IsOptional()
  @IsString({ message: 'جزئیات سالن نامعتبر است.' })
  @MaxLength(500, { message: 'جزئیات سالن حداکثر ۵۰۰ کاراکتر است.' })
  venueDetails?: string;
}
