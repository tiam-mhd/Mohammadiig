import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoiceEntity } from './invoice.entity';
import { InvoicesService } from './invoices.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { InvoicePaymentStatus } from './invoice-status';
import { PaginationQueryDto } from '../common/pagination.dto';

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('mine')
  @ApiOperation({ summary: 'List current customer invoices' })
  mine(@Req() request: AuthenticatedRequest): Promise<InvoiceEntity[]> {
    return this.invoicesService.findMine(request.user);
  }

  @Get('mine/:idOrNumber')
  @ApiOperation({ summary: 'Get one customer invoice with full snapshot' })
  mineOne(
    @Req() request: AuthenticatedRequest,
    @Param('idOrNumber') idOrNumber: string,
  ): Promise<InvoiceEntity> {
    return this.invoicesService.findOneMine(request.user, idOrNumber);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List invoices for operations staff' })
  all(@Query() query: PaginationQueryDto) {
    return this.invoicesService.findAll(query.page, query.limit);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get one invoice for admin' })
  adminOne(@Param('id') id: string): Promise<InvoiceEntity> {
    return this.invoicesService.findOneAdmin(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update invoice payment status' })
  updateStatus(
    @Req() request: AuthenticatedRequest, @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ): Promise<InvoiceEntity> {
    return this.invoicesService.updateStatus(id, dto.status as InvoicePaymentStatus, { userId: request.user.userId, ipAddress: request.ip, userAgent: request.get('user-agent') });
  }
}
