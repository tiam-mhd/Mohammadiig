import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoiceEntity } from './invoice.entity';
import { InvoicesService } from './invoices.service';

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
}
