import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AuthUser } from "../auth/jwt.strategy";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentsService } from "./payments.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UpdatePaymentStatusDto } from "./dto/update-payment-status.dto";
import { PaginationQueryDto } from "../common/pagination.dto";

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags("payments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(":invoiceId/pay")
  @ApiOperation({ summary: "Submit a payment for an invoice" })
  create(
    @Req() request: AuthenticatedRequest,
    @Param("invoiceId") invoiceId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(
      {
        ...request.user,
        ipAddress: request.ip,
        userAgent: request.get("user-agent"),
      },
      invoiceId,
      dto,
    );
  }

  @Post(":invoiceId/pay-test")
  @ApiOperation({
    summary: "Complete invoice via simulated test payment gateway",
  })
  payTest(
    @Req() request: AuthenticatedRequest,
    @Param("invoiceId") invoiceId: string,
  ) {
    return this.paymentsService.payWithTestGateway(request.user, invoiceId);
  }

  @Get("mine")
  @ApiOperation({ summary: "List current customer payments" })
  mine(@Req() request: AuthenticatedRequest) {
    return this.paymentsService.findMine(request.user);
  }

  @Get("admin/all")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "List payments for operations staff" })
  all(@Query() query: PaginationQueryDto) {
    return this.paymentsService.findAll(
      query.page,
      query.limit,
      query.sort,
      query.order,
    );
  }

  @Patch("admin/:id/status")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "بررسی پرداخت و به‌روزرسانی اتمی مانده فاکتور و سفارش",
  })
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.updateStatus(id, dto.status, {
      userId: request.user.userId,
      ipAddress: request.ip,
      userAgent: request.get("user-agent"),
    });
  }
}
