import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

type AccessTokenPayload = {
  id: number;
  phone: string;
  email: string | null;
  role: string;
  sessionId:number
};

type RefreshTokenPayload = {
  id: number;
  sessionId: number;
  type: 'refresh';
};

@Injectable()
export class JwtUtilsService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  generateAccessToken(payload: AccessTokenPayload): string {
    return this.jwt.sign(
      {
        id: payload.id,
        phone: payload.phone,
        email: payload.email,
        role: payload.role,
        sessionId:payload.sessionId
      },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any,
      },
    );
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    return this.jwt.sign(
      {
        id: payload.id,
        sessionId: payload.sessionId,
        type: 'refresh',
      },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      },
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return this.jwt.verify(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return this.jwt.verify(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}