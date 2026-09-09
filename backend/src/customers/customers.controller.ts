import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomerEntity } from './customer.entity';
import { CustomersService } from './customers.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current B2B customer profile' })
  me(@Req() request: AuthenticatedRequest): Promise<CustomerEntity> {
    return this.customersService.findByUserId(request.user.userId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all B2B customers for operations staff' })
  all(): Promise<CustomerEntity[]> { return this.customersService.findAll(); }

  @Patch('admin/:id/verify')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Verify or unverify a B2B customer' })
  verify(@Param('id') id: string, @Body() body: { isVerified: boolean }): Promise<CustomerEntity> {
    return this.customersService.setVerified(id, Boolean(body.isVerified));
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Soft-delete a B2B customer' })
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    await this.customersService.softRemove(id);
    return { ok: true };
  }
}
