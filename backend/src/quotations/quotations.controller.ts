import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestQuotationDto } from './dto/request-quotation.dto';
import { QuotationsService } from './quotations.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post('request')
  @ApiOperation({ summary: 'ثبت درخواست پیش‌فاکتور توسط مشتری' })
  request(@Req() request: AuthenticatedRequest, @Body() dto: RequestQuotationDto) {
    return this.quotationsService.request(request.user, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'فهرست پیش‌فاکتورهای مشتری جاری' })
  mine(@Req() request: AuthenticatedRequest) {
    return this.quotationsService.findMine(request.user);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'پذیرش پیش‌فاکتور توسط مشتری' })
  accept(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.quotationsService.accept(request.user, id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'فهرست پیش‌فاکتورها برای پنل مدیریت' })
  all() {
    return this.quotationsService.findAll();
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'به‌روزرسانی وضعیت پیش‌فاکتور' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired',
  ) {
    return this.quotationsService.updateStatus(id, status);
  }
}
