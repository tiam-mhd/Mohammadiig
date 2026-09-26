import { Type, Transform } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SparePartCheckoutItemDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  sparePartId!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CheckoutAddressDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @ApiProperty()
  @IsString()
  @Length(8, 20)
  @Transform(({ value }) =>
    String(value ?? "")
      .replace(/\s+/g, "")
      .trim(),
  )
  phone!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 100)
  city!: string;

  @ApiProperty()
  @IsString()
  @Length(5, 500)
  address!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 20)
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  province?: string;
}

export class SparePartsCheckoutDto {
  @ApiProperty({ type: [SparePartCheckoutItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SparePartCheckoutItemDto)
  items!: SparePartCheckoutItemDto[];

  @ApiProperty({ type: CheckoutAddressDto })
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  shippingAddress!: CheckoutAddressDto;

  @ApiPropertyOptional({ type: CheckoutAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  billingAddress?: CheckoutAddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string;

  @ApiPropertyOptional({
    description: "If true, immediately run test payment after creating invoice",
  })
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === "true" || value === 1 || value === "1",
  )
  @IsBoolean()
  payWithTestGateway?: boolean;
}
