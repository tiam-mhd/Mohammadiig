import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { PaymentStatus } from "../payment-status";

export class UpdatePaymentStatusDto {
  @ApiProperty({
    enum: PaymentStatus,
    description: "وضعیت پرداخت؛ تغییر فقط از حالت در انتظار مجاز است.",
  })
  @IsEnum(PaymentStatus, { message: "وضعیت پرداخت معتبر نیست." })
  status!: PaymentStatus;
}
