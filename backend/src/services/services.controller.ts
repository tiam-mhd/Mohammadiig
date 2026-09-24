import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaginationQueryDto } from '../common/pagination.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceEntity } from './service.entity';
import { ServicesService } from './services.service';
import { ManageServiceDto } from './dto/manage-service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List active MIG services' })
  findAll(): Promise<ServiceEntity[]> {
    return this.servicesService.findAll();
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List services for admin' })
  adminAll(@Query() query: PaginationQueryDto) {
    return this.servicesService.findAllForAdmin(query.page, query.limit);
  }

  @Get('admin/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get one service for admin editor' })
  adminOne(@Param('id') id: string): Promise<ServiceEntity> {
    return this.servicesService.findOneForAdmin(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create service' })
  create(@Body() dto: ManageServiceDto): Promise<ServiceEntity> {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update service' })
  update(@Param('id') id: string, @Body() dto: Partial<ManageServiceDto>): Promise<ServiceEntity> {
    return this.servicesService.update(id, dto);
  }
}
