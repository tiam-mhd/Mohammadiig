import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUser } from './jwt.strategy';

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(private readonly jwtService: JwtService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
		const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
		if (!token) throw new UnauthorizedException('Authentication required');
		try {
			request.user = await this.jwtService.verifyAsync<AuthUser>(token);
			return true;
		} catch {
			throw new UnauthorizedException('Invalid or expired token');
		}
	}
}
