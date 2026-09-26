import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { AuthUser } from "../auth/jwt.strategy";
import { PaginationQueryDto } from "../common/pagination.dto";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserEntity, UserRole } from "../auth/user.entity";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get("admin/all")
  @ApiOperation({ summary: "List users for administrators" })
  all(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query.page, query.limit, query.search);
  }
  @Patch(":id/role") @ApiOperation({ summary: "Update user role" }) updateRole(
    @Req() request: Request & { user: AuthUser },
    @Param("id") id: string,
    @Body("role") role: UserRole,
  ): Promise<UserEntity> {
    return this.usersService.updateRole(id, role, request.user);
  }
  @Patch(":id/active")
  @ApiOperation({ summary: "Activate or deactivate user" })
  updateActive(
    @Req() request: Request & { user: AuthUser },
    @Param("id") id: string,
    @Body("isActive") isActive: boolean,
  ): Promise<UserEntity> {
    return this.usersService.updateActive(id, isActive, request.user);
  }
}
