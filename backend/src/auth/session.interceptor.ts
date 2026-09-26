import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable, map } from "rxjs";
import {
  assertRequestOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "./session-cookie";

@Injectable()
export class SessionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    assertRequestOrigin(request);
    response.setHeader("Cache-Control", "no-store");
    return next.handle().pipe(
      map((body: unknown) => {
        if (
          body &&
          typeof body === "object" &&
          "accessToken" in body &&
          typeof body.accessToken === "string"
        ) {
          response.cookie(SESSION_COOKIE, body.accessToken, {
            ...sessionCookieOptions(),
            maxAge: 86400000,
          });
          // Compatibility flag for existing UI callers; never a credential.
          return { ...body, accessToken: "cookie-session" };
        }
        return body;
      }),
    );
  }
}
