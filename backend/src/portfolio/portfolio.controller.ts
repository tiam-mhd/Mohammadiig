import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { ManagePortfolioWorkDto } from './dto/manage-portfolio-work.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PortfolioWorkEntity } from './portfolio-work.entity';

@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'List published portfolio works' })
  findPublished(): Promise<PortfolioWorkEntity[]> {
    return this.portfolioService.findPublished();
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all portfolio works for admin' })
  adminAll(): Promise<PortfolioWorkEntity[]> {
    return this.portfolioService.findAllForAdmin();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published portfolio work by slug' })
  findBySlug(@Param('slug') slug: string): Promise<PortfolioWorkEntity> {
    return this.portfolioService.findPublishedBySlug(slug);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create portfolio work' })
  create(@Body() dto: ManagePortfolioWorkDto): Promise<PortfolioWorkEntity> {
    return this.portfolioService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update portfolio work' })
  update(@Param('id') id: string, @Body() dto: ManagePortfolioWorkDto): Promise<PortfolioWorkEntity> {
    return this.portfolioService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Soft-delete portfolio work' })
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    await this.portfolioService.remove(id);
    return { ok: true };
  }
}
