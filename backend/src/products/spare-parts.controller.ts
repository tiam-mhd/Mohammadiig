import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductExtensionsService } from './product-extensions.service';
import { ManageSparePartDto, PatchSparePartDto } from './dto/manage-spare-part.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SparePartEntity } from './spare-part.entity';

@ApiTags('spare-parts')
@Controller('spare-parts')
export class SparePartsController {
  constructor(private readonly extensionsService: ProductExtensionsService) {}

  @Get()
  @ApiOperation({ summary: 'List active spare parts (optional filters)' })
  findAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('inStock') inStock?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') rawPage = '1',
    @Query('limit') rawLimit = '20',
  ) {
    return this.extensionsService.findSpareParts({
      q,
      category,
      inStock: inStock === '1' || inStock === 'true',
      minPrice: minPrice != null && minPrice !== '' ? Number(minPrice) : undefined,
      maxPrice: maxPrice != null && maxPrice !== '' ? Number(maxPrice) : undefined,
      page: Number(rawPage),
      limit: Number(rawLimit),
    });
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all spare parts for admin' })
  adminAll(@Query('page') rawPage = '1', @Query('limit') rawLimit = '20', @Query('q') q?: string): Promise<{ data: SparePartEntity[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    return this.extensionsService.findSparePartsForAdmin(Number(rawPage), Number(rawLimit), q);
  }

  @Get('admin/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get one spare part for admin editor' })
  adminOne(@Param('id') id: string): Promise<SparePartEntity> {
    return this.extensionsService.findSparePartForAdmin(id);
  }

  @Get(':slugOrId')
  @ApiOperation({ summary: 'Get one public spare part by slug or id' })
  findOne(@Param('slugOrId') slugOrId: string): Promise<SparePartEntity> {
    return this.extensionsService.findSparePartPublic(slugOrId);
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
  @ApiOperation({ summary: 'Update spare part (full or partial / quick edit)' })
  update(@Param('id') id: string, @Body() dto: PatchSparePartDto): Promise<SparePartEntity> {
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
