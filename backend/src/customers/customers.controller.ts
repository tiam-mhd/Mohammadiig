import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
  @Roles('admin', 'salesman')
  @ApiOperation({ summary: 'List all B2B customers for operations staff' })
  all(): Promise<CustomerEntity[]> { return this.customersService.findAll(); }
}
