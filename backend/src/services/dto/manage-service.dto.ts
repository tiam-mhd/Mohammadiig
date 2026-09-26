import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ManageServiceDto {
  @ApiProperty() @IsString() @Length(2, 150) nameFa!: string;
  @ApiProperty() @IsString() @Length(2, 150) nameEn!: string;
  @ApiProperty() @IsString() @Length(10, 2000) description!: string;
  @ApiProperty({
    enum: [
      "installation",
      "training",
      "maintenance",
      "support",
      "customization",
      "other",
    ],
  })
  @IsIn([
    "installation",
    "training",
    "maintenance",
    "support",
    "customization",
    "other",
  ])
  serviceCategory!: string;

  @ApiPropertyOptional({ description: "قیمت اختیاری؛ خالی = بدون نمایش قیمت" })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  basePrice?: number | null;

  @ApiPropertyOptional({ description: "قیمت توافقی — بدون نمایش مبلغ ریالی" })
  @IsOptional()
  @IsBoolean()
  priceNegotiable?: boolean;

  @ApiProperty({
    enum: ["per_hour", "per_day", "per_visit", "per_unit", "fixed"],
  })
  @IsIn(["per_hour", "per_day", "per_visit", "per_unit", "fixed"])
  unitType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Type(() => String)
  gallery?: string[];

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
