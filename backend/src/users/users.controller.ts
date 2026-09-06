import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserEntity, UserRole } from '../auth/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('admin/all') @ApiOperation({ summary: 'List users for administrators' }) all(): Promise<UserEntity[]> { return this.usersService.findAll(); }
  @Patch(':id/role') @ApiOperation({ summary: 'Update user role' }) updateRole(@Param('id') id: string, @Body('role') role: UserRole): Promise<UserEntity> { return this.usersService.updateRole(id, role); }
  @Patch(':id/active') @ApiOperation({ summary: 'Activate or deactivate user' }) updateActive(@Param('id') id: string, @Body('isActive') isActive: boolean): Promise<UserEntity> { return this.usersService.updateActive(id, isActive); }
}
