import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ManageOpsProjectDto } from './dto/manage-ops-project.dto';
import { ProjectEntity } from './project.entity';
import { ProjectsService } from './projects.service';

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List published ops projects' })
  findPublished(): Promise<ProjectEntity[]> {
    return this.projectsService.findPublished();
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all ops projects for admin' })
  adminAll(): Promise<ProjectEntity[]> {
    return this.projectsService.findAllForAdmin();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published ops project by slug' })
  findBySlug(@Param('slug') slug: string): Promise<ProjectEntity> {
    return this.projectsService.findPublishedBySlug(slug);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create ops project (admin only)' })
  create(@Req() request: AuthenticatedRequest, @Body() dto: ManageOpsProjectDto): Promise<ProjectEntity> {
    return this.projectsService.create(dto, request.user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update ops project' })
  update(@Param('id') id: string, @Body() dto: ManageOpsProjectDto): Promise<ProjectEntity> {
    return this.projectsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update ops project status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string): Promise<ProjectEntity> {
    return this.projectsService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Soft-delete ops project' })
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    await this.projectsService.remove(id);
    return { ok: true };
  }
}
