import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoiceEntity } from './invoice.entity';
import { InvoicesService } from './invoices.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('mine')
  @ApiOperation({ summary: 'List current customer invoices' })
  mine(@Req() request: AuthenticatedRequest): Promise<InvoiceEntity[]> { return this.invoicesService.findMine(request.user); }
  @Get('admin/all') @UseGuards(RolesGuard) @Roles('admin') @ApiOperation({ summary: 'List invoices for operations staff' }) all(): Promise<InvoiceEntity[]> { return this.invoicesService.findAll(); }
  @Patch(':id/status') @UseGuards(RolesGuard) @Roles('admin') @ApiOperation({ summary: 'Update invoice payment status' }) updateStatus(@Param('id') id: string, @Body('status') status: string): Promise<InvoiceEntity> { return this.invoicesService.updateStatus(id, status); }
}
