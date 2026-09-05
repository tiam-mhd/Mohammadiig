import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty({ minLength: 8 }) @IsString() @Length(8, 128) password!: string;
  @ApiProperty() @IsString() @Length(2, 100) firstName!: string;
  @ApiProperty() @IsString() @Length(2, 100) lastName!: string;
  @ApiProperty() @IsString() @Length(2, 255) companyName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^[0-9+()\-\s]{7,20}$/) phone?: string;
}

export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @Length(8, 128) password!: string;
}
