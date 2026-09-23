import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum QuotationStatus { Draft = 'draft', Sent = 'sent', Accepted = 'accepted', Rejected = 'rejected', Expired = 'expired' }
export class UpdateQuotationStatusDto {
  @ApiProperty({ enum: QuotationStatus, description: 'پذیرش فقط از مسیر مشتری انجام می‌شود.' })
  @IsEnum(QuotationStatus, { message: 'وضعیت پیش‌فاکتور معتبر نیست.' })
  status!: QuotationStatus;
}
