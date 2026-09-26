import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { AuthUser } from "./jwt.strategy";
import { AuthService } from "./auth.service";
import { SessionService } from "./session.service";
import { assertRequestOrigin, readSessionCookie } from "./session-cookie";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    assertRequestOrigin(request);
    const token =
      readSessionCookie(request) ??
      request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token)
      throw new UnauthorizedException("برای ادامه وارد حساب خود شوید.");
    let payload: AuthUser;
    try {
      payload = await this.jwtService.verifyAsync<AuthUser>(token);
    } catch {
      throw new UnauthorizedException(
        "نشست منقضی یا نامعتبر است. دوباره وارد شوید.",
      );
    }
    await this.sessions.validate(token, payload.userId);
    request.user = await this.authService.validateSession(payload);
    return true;
  }
}
