import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) amount!: number;
  @ApiProperty({ enum: ['bank_transfer', 'credit_card', 'check', 'cash', 'cryptocurrency', 'other'] }) @IsIn(['bank_transfer', 'credit_card', 'check', 'cash', 'cryptocurrency', 'other']) paymentMethod!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() transactionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
