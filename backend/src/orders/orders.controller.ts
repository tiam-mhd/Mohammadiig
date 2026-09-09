import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('from-quotation/:quotationId')
  @ApiOperation({ summary: 'Convert an accepted quotation into an order' })
  convert(@Req() request: AuthenticatedRequest, @Param('quotationId') quotationId: string) {
    return this.ordersService.convertQuotation(request.user, quotationId);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List current customer orders' })
  mine(@Req() request: AuthenticatedRequest) {
    return this.ordersService.findMine(request.user);
  }

  @Get(':idOrNumber/track')
  @ApiOperation({ summary: 'Track a customer order' })
  track(@Req() request: AuthenticatedRequest, @Param('idOrNumber') idOrNumber: string) {
    return this.ordersService.findOneMine(request.user, idOrNumber);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List orders for operations staff' })
  all() { return this.ordersService.findAll(); }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) { return this.ordersService.updateStatus(id, status); }
}
