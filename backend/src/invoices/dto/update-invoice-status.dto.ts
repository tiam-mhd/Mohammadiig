import { IsEnum } from "class-validator";
import { InvoicePaymentStatus } from "../invoice-status";

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoicePaymentStatus, { message: "وضعیت پرداخت فاکتور نامعتبر است." })
  status!: InvoicePaymentStatus;
}
