import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAttachmentDto {
  @ApiProperty({ enum: ['Order', 'Quotation', 'Project', 'Invoice', 'ProjectPhase'] }) @IsIn(['Order', 'Quotation', 'Project', 'Invoice', 'ProjectPhase']) ownerType!: string;
  @ApiProperty() @IsString() @IsNotEmpty() ownerId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() fileName!: string;
  @ApiProperty() @IsString() @IsNotEmpty() fileUrl!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100000000) fileSize?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() fileType?: string;
}
