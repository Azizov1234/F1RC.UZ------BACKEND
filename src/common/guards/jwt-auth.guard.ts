import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from 'src/core/prisma/prisma.service';
import { JwtUtilsService } from 'src/common/utils/jwt.service';
import { UserStatus } from '@prisma/client';

type JwtPayload = {
  id: number;
  email: string | null;
  phone: string;
  role: string;
  sessionId: number
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtUtilsService,
    private readonly prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token topilmadi');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException("Token formati noto'g'ri");
    }

    let payload: JwtPayload;

    try {
      payload = this.jwt.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    if (!payload?.id || !payload?.sessionId) {
      throw new UnauthorizedException("Token payload noto'g'ri");
    }


    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User topilmadi');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Account is inactive');
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Account is banned');
    }

    if (user.status === UserStatus.DELETED) {
      throw new ForbiddenException('Account is deleted');
    }


    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }

    const session = await this.prisma.userSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.id,
      },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
        expiresAt: true,
      },
    });
    if (!session) {
      throw new UnauthorizedException('Session topilmadi yoki userga tegishli emas');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Account is already logged out');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session is expired');
    }

    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      sessionId: session.id
    };

    return true;
  }
}