import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuotationRequestItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() productId!: string;
  @ApiProperty({ minimum: 1 }) @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @ApiPropertyOptional() @IsOptional() @IsObject() customizations?: Record<string, string>;
}

export class RequestQuotationDto {
  @ApiProperty({ type: [QuotationRequestItemDto] })
  @ValidateNested({ each: true }) @Type(() => QuotationRequestItemDto) items!: QuotationRequestItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
