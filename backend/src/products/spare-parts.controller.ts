import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductExtensionsService } from './product-extensions.service';

@ApiTags('spare-parts')
@Controller('spare-parts')
export class SparePartsController {
  constructor(private readonly extensionsService: ProductExtensionsService) {}
  @Get() @ApiOperation({ summary: 'List active spare parts' }) findAll() { return this.extensionsService.findSpareParts(); }
}
