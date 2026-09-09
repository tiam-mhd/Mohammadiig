import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CreateProjectDto { @IsString() @IsNotEmpty() @Length(2, 200) projectName!: string; @IsString() @IsNotEmpty() @Length(10, 2000) description!: string; }
type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}
  @Get('mine') @ApiOperation({ summary: 'List current customer projects' }) mine(@Req() request: AuthenticatedRequest) { return this.projectsService.findMine(request.user); }
  @Post() @ApiOperation({ summary: 'Request a new customer project' }) create(@Req() request: AuthenticatedRequest, @Body() dto: CreateProjectDto) { return this.projectsService.createForCustomer(request.user, dto.projectName, dto.description); }
  @Get(':id/phases') @ApiOperation({ summary: 'List project phases' }) phases(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.projectsService.findPhases(request.user, id); }
  @Get(':id') @ApiOperation({ summary: 'Get a customer project' }) findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.projectsService.findOneMine(request.user, id); }
  @Get('admin/all') @UseGuards(RolesGuard) @Roles('admin') @ApiOperation({ summary: 'List projects for operations staff' }) all() { return this.projectsService.findAll(); }
  @Patch(':id/status') @UseGuards(RolesGuard) @Roles('admin') @ApiOperation({ summary: 'Update project status' }) updateStatus(@Param('id') id: string, @Body('status') status: string) { return this.projectsService.updateStatus(id, status); }
}
