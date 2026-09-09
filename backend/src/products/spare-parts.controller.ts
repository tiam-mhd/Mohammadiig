import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductExtensionsService } from './product-extensions.service';
import { ManageSparePartDto } from './dto/manage-spare-part.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SparePartEntity } from './spare-part.entity';

@ApiTags('spare-parts')
@Controller('spare-parts')
export class SparePartsController {
  constructor(private readonly extensionsService: ProductExtensionsService) {}

  @Get()
  @ApiOperation({ summary: 'List active spare parts' })
  findAll(): Promise<SparePartEntity[]> {
    return this.extensionsService.findSpareParts();
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all spare parts for admin' })
  adminAll(): Promise<SparePartEntity[]> {
    return this.extensionsService.findSparePartsForAdmin();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create spare part' })
  create(@Body() dto: ManageSparePartDto): Promise<SparePartEntity> {
    return this.extensionsService.createSparePart(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update spare part' })
  update(@Param('id') id: string, @Body() dto: ManageSparePartDto): Promise<SparePartEntity> {
    return this.extensionsService.updateSparePart(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Soft-delete spare part' })
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    await this.extensionsService.removeSparePart(id);
    return { ok: true };
  }
}
