import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from './jwt.strategy';

export const ADMIN_ROLES = ['admin', 'salesman'] as const;

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler()) ?? [];
    if (requiredRoles.length === 0) return true;
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    return requiredRoles.includes(request.user?.role ?? '');
  }
}
