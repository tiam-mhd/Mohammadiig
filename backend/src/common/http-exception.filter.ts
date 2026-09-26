import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const correlationId = randomUUID();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const defaults: Record<number, string> = {
      400: "اطلاعات ارسال‌شده معتبر نیست.",
      401: "برای ادامه دوباره وارد حساب خود شوید.",
      403: "شما اجازهٔ انجام این عملیات را ندارید.",
      404: "اطلاعات درخواستی یافت نشد.",
      409: "این عملیات با وضعیت فعلی اطلاعات سازگار نیست.",
      413: "حجم فایل بیش از حد مجاز است.",
      429: "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد تلاش کنید.",
    };
    let message: string | string[] =
      defaults[status] ?? "خطای داخلی رخ داد. لطفاً دوباره تلاش کنید.";
    if (status < 500 && exception instanceof HttpException) {
      const body = exception.getResponse();
      const raw =
        typeof body === "string"
          ? body
          : (body as { message?: unknown }).message;
      const messages = (Array.isArray(raw) ? raw : [raw]).filter(
        (item): item is string => typeof item === "string",
      );
      if (messages.length)
        message = messages.map((item) =>
          /[\u0600-\u06ff]/.test(item)
            ? item
            : (defaults[status] ?? "درخواست معتبر نیست."),
        );
    }
    if (status >= 500) {
      // Stack frames retain diagnostic location without logging credentials, bodies or SQL parameters.
      const frames =
        exception instanceof Error
          ? exception.stack?.split("\n").slice(1).join("\n")
          : undefined;
      this.logger.error(
        JSON.stringify({
          correlationId,
          status,
          method: request.method,
          path: request.path,
          errorType:
            exception instanceof Error ? exception.name : "UnknownError",
        }),
        frames,
      );
    }
    response.setHeader("X-Correlation-ID", correlationId);
    response
      .status(status)
      .json({ statusCode: status, message, correlationId });
  }
}
