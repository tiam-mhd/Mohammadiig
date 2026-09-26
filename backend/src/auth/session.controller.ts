import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthUser } from "./jwt.strategy";
import { UserEntity } from "./user.entity";
import { SessionService } from "./session.service";
import {
  assertRequestOrigin,
  readSessionCookie,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "./session-cookie";

@ApiTags("auth")
@ApiCookieAuth("mig_session")
@Controller("auth")
export class SessionController {
  constructor(
    private readonly sessions: SessionService,
    private readonly db: DataSource,
  ) {}
  @Get("session")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "بررسی نشست فعال و دریافت مشخصات عمومی کاربر" })
  async session(
    @Req() request: Request & { user: AuthUser },
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader("Cache-Control", "no-store");
    const user = await this.db
      .getRepository(UserEntity)
      .findOneByOrFail({ id: request.user.userId });
    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyName: user.companyName,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }
  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "ابطال نشست سمت سرور و حذف Cookie؛ قابل تکرار" })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    assertRequestOrigin(request);
    const token =
      readSessionCookie(request) ??
      request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (token) await this.sessions.revoke(token);
    response.clearCookie(SESSION_COOKIE, sessionCookieOptions());
    response.setHeader("Cache-Control", "no-store");
    return { message: "خروج با موفقیت انجام شد." };
  }
}
