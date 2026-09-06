import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  findAll(): Promise<ServiceEntity[]> { return this.servicesService.findAll(); }
  @Get('admin/all') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'salesman') @ApiOperation({ summary: 'List services for admin' }) adminAll(): Promise<ServiceEntity[]> { return this.servicesService.findAllForAdmin(); }
  @Post() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'salesman') @ApiOperation({ summary: 'Create service' }) create(@Body() dto: ManageServiceDto): Promise<ServiceEntity> { return this.servicesService.create(dto); }
  @Patch(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'salesman') @ApiOperation({ summary: 'Update service' }) update(@Param('id') id: string, @Body() dto: Partial<ManageServiceDto>): Promise<ServiceEntity> { return this.servicesService.update(id, dto); }
}
