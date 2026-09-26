import { ForbiddenException } from "@nestjs/common";
import { Request, CookieOptions } from "express";

export const SESSION_COOKIE = "mig_session";
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}
export function readSessionCookie(request: Request): string | undefined {
  const value = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return value?.slice(SESSION_COOKIE.length + 1);
}
export function assertRequestOrigin(request: Request): void {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.get("origin");
  const allowed = (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .split(",")
    .map((value) => value.trim());
  if (origin && !allowed.includes(origin))
    throw new ForbiddenException("مبدأ درخواست مجاز نیست.");
  if (readSessionCookie(request) && request.get("x-mig-csrf") !== "1") {
    throw new ForbiddenException(
      "اعتبار درخواست تأیید نشد. صفحه را تازه‌سازی کنید.",
    );
  }
}
