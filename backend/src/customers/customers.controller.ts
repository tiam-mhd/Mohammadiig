import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AuthUser } from "../auth/jwt.strategy";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CustomerEntity } from "./customer.entity";
import { CustomersService } from "./customers.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import {
  CustomerListQueryDto,
  PermanentlyDeleteCustomerDto,
  UpdateCustomerStatusDto,
} from "./dto/customer-admin.dto";

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags("customers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current B2B customer profile" })
  me(
    @Req() request: AuthenticatedRequest,
  ): Promise<Omit<CustomerEntity, "statusReason" | "statusChangedBy">> {
    return this.customersService.findByUserId(request.user.userId);
  }

  @Get("admin/all")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "List all B2B customers for operations staff" })
  all(@Query() query: CustomerListQueryDto) {
    return this.customersService.findAll(
      query.status,
      query.page,
      query.limit,
      query.search,
    );
  }

  @Patch("admin/:id/status")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary:
      "Set customer verification and account access; deleted customers are read-only",
  })
  updateStatus(
    @Param("id") id: string,
    @Body() body: UpdateCustomerStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.customersService.updateStatus(id, body, request.user.userId);
  }

  @Delete("admin/:id/permanent")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary:
      "Permanently erase a soft-deleted customer identity, preserving anonymous financial records",
  })
  async permanentlyRemove(
    @Param("id") id: string,
    @Body() body: PermanentlyDeleteCustomerDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ ok: true }> {
    await this.customersService.permanentlyRemove(id, request.user.userId);
    return { ok: true };
  }

  @Get("admin/:id/360")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Full 360° customer profile with orders, invoices, payments",
  })
  customer360(@Param("id") id: string) {
    return this.customersService.get360(id);
  }

  @Patch("admin/:id/verify")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Verify or unverify a B2B customer" })
  verify(
    @Param("id") id: string,
    @Body() body: { isVerified: boolean },
  ): Promise<CustomerEntity> {
    return this.customersService.setVerified(id, Boolean(body.isVerified));
  }

  @Delete("admin/:id")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Soft-delete a B2B customer" })
  async remove(@Param("id") id: string): Promise<{ ok: true }> {
    await this.customersService.softRemove(id);
    return { ok: true };
  }
}
