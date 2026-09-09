import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListProductsDto } from './dto/list-products.dto';
import { Product, ProductListResponse } from './product.types';
import { ProductsService } from './products.service';
import { ManageProductDto } from './dto/manage-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProductExtensionsService } from './product-extensions.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService, private readonly extensionsService: ProductExtensionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: ManageProductDto): Promise<Product> { return this.productsService.create(dto); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: ManageProductDto): Promise<Product> { return this.productsService.update(id, dto); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string): Promise<void> { return this.productsService.remove(id); }

  @Get()
  @ApiOperation({ summary: 'List products with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  async findAll(@Query() query: ListProductsDto): Promise<ProductListResponse> {
    return this.productsService.findAll(query);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a product by id or slug' })
  @ApiParam({ name: 'idOrSlug' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('idOrSlug') idOrSlug: string): Promise<Product> {
    return this.productsService.findOne(idOrSlug);
  }

  @Get(':id/variants') variants(@Param('id') id: string) { return this.extensionsService.findVariants(id); }
  @Get(':id/specifications') specifications(@Param('id') id: string) { return this.extensionsService.findSpecifications(id); }
}
