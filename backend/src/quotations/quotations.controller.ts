import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestQuotationDto } from './dto/request-quotation.dto';
import { QuotationsService } from './quotations.service';

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Request a custom B2B quotation' })
  request(@Req() request: AuthenticatedRequest, @Body() dto: RequestQuotationDto) {
    return this.quotationsService.request(request.user, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List current customer quotations' })
  mine(@Req() request: AuthenticatedRequest) {
    return this.quotationsService.findMine(request.user);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept a customer quotation' })
  accept(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.quotationsService.accept(request.user, id);
  }
}
