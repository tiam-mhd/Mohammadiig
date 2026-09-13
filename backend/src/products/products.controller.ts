import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListProductsDto } from './dto/list-products.dto';
import { Product, ProductListResponse } from './product.types';
import { ProductsService } from './products.service';
import { ManageProductDto } from './dto/manage-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProductExtensionsService } from './product-extensions.service';
import {
  CopyProductSpecsDto,
  ManageProductSpecificationDto,
  ManageProductVariantDto,
  ReorderProductSpecificationsDto,
} from './dto/manage-product-extensions.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly extensionsService: ProductExtensionsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: ManageProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List products for admin (active / trash / all)' })
  adminAll(@Query('status') status?: 'active' | 'trash' | 'all'): Promise<Product[]> {
    const normalized = status === 'trash' || status === 'all' ? status : 'active';
    return this.productsService.findAllForAdmin(normalized);
  }

  @Get('admin/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get one product for admin editor' })
  adminOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOneForAdmin(id);
  }

  @Get('admin/:id/variants')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminVariants(@Param('id') id: string) {
    return this.extensionsService.findVariantsForAdmin(id);
  }

  @Get('admin/:id/specifications')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminSpecifications(@Param('id') id: string) {
    return this.extensionsService.findSpecifications(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: ManageProductDto): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id/purge')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Permanently delete a product (hard delete)' })
  async purge(@Param('id') id: string): Promise<{ ok: true }> {
    await this.productsService.purge(id);
    return { ok: true };
  }

  @Post(':id/restore')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Restore a soft-deleted product' })
  restore(@Param('id') id: string): Promise<Product> {
    return this.productsService.restore(id);
  }

  @Post(':id/copy-specs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Copy specifications from another product' })
  copySpecs(@Param('id') id: string, @Body() dto: CopyProductSpecsDto) {
    return this.extensionsService.copySpecifications(id, dto);
  }

  @Post(':id/specifications')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createSpecification(@Param('id') id: string, @Body() dto: ManageProductSpecificationDto) {
    return this.extensionsService.createSpecification(id, dto);
  }

  @Patch(':id/specifications/reorder')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  reorderSpecifications(@Param('id') id: string, @Body() dto: ReorderProductSpecificationsDto) {
    return this.extensionsService.reorderSpecifications(id, dto);
  }

  @Patch(':id/specifications/:specId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateSpecification(
    @Param('id') id: string,
    @Param('specId') specId: string,
    @Body() dto: ManageProductSpecificationDto,
  ) {
    return this.extensionsService.updateSpecification(id, specId, dto);
  }

  @Delete(':id/specifications/:specId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async removeSpecification(@Param('id') id: string, @Param('specId') specId: string): Promise<{ ok: true }> {
    await this.extensionsService.removeSpecification(id, specId);
    return { ok: true };
  }

  @Post(':id/variants')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createVariant(@Param('id') id: string, @Body() dto: ManageProductVariantDto) {
    return this.extensionsService.createVariant(id, dto);
  }

  @Patch(':id/variants/:variantId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: ManageProductVariantDto,
  ) {
    return this.extensionsService.updateVariant(id, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async removeVariant(@Param('id') id: string, @Param('variantId') variantId: string): Promise<{ ok: true }> {
    await this.extensionsService.removeVariant(id, variantId);
    return { ok: true };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: 'List products with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  async findAll(@Query() query: ListProductsDto): Promise<ProductListResponse> {
    return this.productsService.findAll(query);
  }

  @Get(':id/variants')
  variants(@Param('id') id: string) {
    return this.extensionsService.findVariants(id);
  }

  @Get(':id/specifications')
  specifications(@Param('id') id: string) {
    return this.extensionsService.findSpecifications(id);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a product by id or slug' })
  @ApiParam({ name: 'idOrSlug' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('idOrSlug') idOrSlug: string): Promise<Product> {
    return this.productsService.findOne(idOrSlug);
  }
}
