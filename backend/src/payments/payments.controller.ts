import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':invoiceId/pay')
  @ApiOperation({ summary: 'Submit a payment for an invoice' })
  create(@Req() request: AuthenticatedRequest, @Param('invoiceId') invoiceId: string, @Body() dto: CreatePaymentDto) { return this.paymentsService.create(request.user, invoiceId, dto); }
  @Get('admin/all') @UseGuards(RolesGuard) @Roles('admin', 'accountant') @ApiOperation({ summary: 'List payments for operations staff' }) all() { return this.paymentsService.findAll(); }
  @Patch('admin/:id/status') @UseGuards(RolesGuard) @Roles('admin', 'accountant') @ApiOperation({ summary: 'Update payment status' }) updateStatus(@Param('id') id: string, @Body('status') status: string) { return this.paymentsService.updateStatus(id, status); }
}
