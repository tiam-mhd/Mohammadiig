import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':invoiceId/pay')
  @ApiOperation({ summary: 'Submit a payment for an invoice' })
  create(@Req() request: AuthenticatedRequest, @Param('invoiceId') invoiceId: string, @Body() dto: CreatePaymentDto) { return this.paymentsService.create(request.user, invoiceId, dto); }
}
