import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
export class PaginationQueryDto { @IsOptional() @Type(() => Number) @IsInt({ message: 'شماره صفحه باید عدد صحیح باشد.' }) @Min(1, { message: 'شماره صفحه نامعتبر است.' }) page = 1; @IsOptional() @Type(() => Number) @IsInt({ message: 'تعداد نمایش باید عدد صحیح باشد.' }) @Min(1, { message: 'تعداد نمایش باید حداقل ۱ باشد.' }) @Max(100, { message: 'تعداد نمایش نمی‌تواند بیشتر از ۱۰۰ باشد.' }) limit = 20; @IsOptional() @IsString({ message: 'جستجو نامعتبر است.' }) search?: string; }
