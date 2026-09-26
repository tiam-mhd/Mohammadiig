import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  Equals,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { CUSTOMER_STATUSES, CustomerStatus } from "../customer-status";
import { PaginationQueryDto } from "../../common/pagination.dto";

export class CustomerListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: ["current", "deleted"], default: "current" })
  @IsOptional()
  @IsIn(["current", "deleted"])
  status?: "current" | "deleted";
}

export class UpdateCustomerStatusDto {
  @ApiPropertyOptional({ enum: CUSTOMER_STATUSES })
  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: CustomerStatus;

  @ApiPropertyOptional({
    maxLength: 1000,
    description: "Required for blocked status; staff-only note",
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional({
    deprecated: true,
    description: "Legacy active/inactive access flag",
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty()
  @IsBoolean()
  isVerified!: boolean;
}

export class PermanentlyDeleteCustomerDto {
  @ApiProperty({
    enum: ["حذف دائمی"],
    description: "Explicit irreversible erasure confirmation",
  })
  @Equals("حذف دائمی")
  confirmation!: string;
}
