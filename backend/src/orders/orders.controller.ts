import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SparePartsCheckoutDto } from './dto/spare-parts-checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationQueryDto } from '../common/pagination.dto';

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

  @Post('spare-parts/checkout')
  @ApiOperation({ summary: 'Checkout spare parts cart into order + invoice (+ optional test payment)' })
  checkoutSpareParts(@Req() request: AuthenticatedRequest, @Body() dto: SparePartsCheckoutDto) {
    return this.ordersService.checkoutSpareParts(request.user, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List current customer orders' })
  mine(@Req() request: AuthenticatedRequest) {
    return this.ordersService.findMine(request.user);
  }

  @Get('mine/:idOrNumber')
  @ApiOperation({ summary: 'Get customer order detail with line items' })
  mineOne(@Req() request: AuthenticatedRequest, @Param('idOrNumber') idOrNumber: string) {
    return this.ordersService.findOneMine(request.user, idOrNumber);
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
  all(@Query() query: PaginationQueryDto) {
    return this.ordersService.findAll(query.page, query.limit, query.sort, query.order);
  }

  @Get('admin/detailed')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List orders with line items and invoices' })
  allDetailed() {
    return this.ordersService.findAllDetailed();
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get one order with line items' })
  adminOne(@Param('id') id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status, { userId: request.user.userId, ipAddress: request.ip, userAgent: request.get('user-agent') });
  }
}
