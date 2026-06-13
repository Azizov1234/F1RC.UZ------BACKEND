import {
    ConflictException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/core/prisma/prisma.service';
import { LoginDto, LogOutDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { JwtUtilsService } from 'src/common/utils/jwt.service';
import { BcryptUtilsService } from 'src/common/utils/bcrypt.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtUtilsService,
        private readonly bcrypt: BcryptUtilsService,
        private readonly config: ConfigService,
    ) { }

    async register(payload: RegisterDto, req?: any) {
        const fullName = payload.fullName.trim();
        const phone = this.normalizePhone(payload.phone);
        const email = this.normalizeEmail(payload.email);

        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ phone }, ...(email ? [{ email }] : [])],
            },
            select: {
                id: true,
                phone: true,
                email: true,
            },
        });

        if (existingUser) {
            if (existingUser.phone === phone) {
                throw new ConflictException('Phone number already used');
            }

            if (email && existingUser.email === email) {
                throw new ConflictException('Email already used');
            }

            throw new ConflictException('User already exists');
        }

        const passwordHash = await this.bcrypt.generateHashPass(payload.password);

        try {
            const user = await this.prisma.user.create({
                data: {
                    fullName,
                    phone,
                    email,
                    passwordHash,
                    profile: {
                        create: {},
                    },
                },
                select: this.safeUserSelect(),
            });

            const tokens = await this.issueTokens(
                {
                    id: user.id,
                    phone: user.phone,
                    email: user.email,
                    role: user.role,
                },
                req,
            );

            return {
                success: true,
                message: 'User registered successfully',
                ...tokens,
                user: this.formatAuthUser(user),
            };
        } catch (error: any) {
            if (error?.code === 'P2002') {
                const target = error?.meta?.target;

                if (Array.isArray(target) && target.includes('phone')) {
                    throw new ConflictException('Phone number already used');
                }

                if (Array.isArray(target) && target.includes('email')) {
                    throw new ConflictException('Email already used');
                }

                throw new ConflictException('User already exists');
            }

            throw new InternalServerErrorException('Registration failed');
        }
    }

    async login(payload: LoginDto, req?: any) {
        const phone = this.normalizePhone(payload.phone);

        const existingUser = await this.prisma.user.findUnique({
            where: {
                phone,
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                passwordHash: true,
                role: true,
                status: true,
                profile: {
                    select: {
                        isCompleted: true,
                    },
                },
            },
        });

        if (!existingUser) {
            throw new UnauthorizedException('Phone number or password is wrong');
        }

        const isPasswordValid = await this.bcrypt.comparePasswords(
            payload.password,
            existingUser.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Phone number or password is wrong');
        }

        this.checkUserStatus(existingUser.status);

        await this.prisma.user.update({
            where: {
                id: existingUser.id,
            },
            data: {
                lastLoginAt: new Date(),
            },
        });

        const tokens = await this.issueTokens(
            {
                id: existingUser.id,
                phone: existingUser.phone,
                email: existingUser.email,
                role: existingUser.role,
            },
            req,
        );

        return {
            success: true,
            message: 'User successfully entered the system',
            ...tokens,
            user: this.formatAuthUser(existingUser),
        };
    }

    async refresh(refreshToken_: RefreshDto) {
        const {refreshToken}=refreshToken_
        
        const payload = this.jwt.verifyRefreshToken(refreshToken)

        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.id
            }
        })
        if (!user) {
            throw new NotFoundException("User is not found")
        }
        this.checkUserStatus(user.status)

        const userSession = await this.prisma.userSession.findUnique({
            where: {
                id: payload.sessionId,
                userId: payload.id
            },
            select: {
                id: true,
                userId: true,
                revokedAt: true,
                expiresAt: true,
                refreshTokenHash: true
            }
        })

        if (!userSession) {
            throw new NotFoundException("User is not found from session ")
        }

        if (userSession.revokedAt) {
            throw new UnauthorizedException("User already logged out ")
        }

        if (userSession.expiresAt < new Date()) {
            throw new UnauthorizedException("Session is expired")
        }
        const isMatchRefresh = await this.bcrypt.comparePasswords(refreshToken, userSession.refreshTokenHash)
        if (!isMatchRefresh) {
            throw new UnauthorizedException("Invalid data token")
        }
        const newrefreshToken = this.jwt.generateRefreshToken({
            id: userSession.userId,
            sessionId: userSession.id,
            type: "refresh"
        })
        const accessToken = this.jwt.generateAccessToken({
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            sessionId: userSession.id
        })
        const newrefreshTokenHash = await this.bcrypt.generateHashPass(newrefreshToken)
        await this.prisma.userSession.update({
            where: {
                id: userSession.id
            },
            data: {
                refreshTokenHash: newrefreshTokenHash
            }
        })

        return {
            succes: true,
            accessToken,
            refreshToken: newrefreshToken
        }
    }

    async logout(payload: LogOutDto) {
        let tokenPayload: {
            id: number;
            sessionId: number;
            type: 'refresh';
        };

        try {
            tokenPayload = this.jwt.verifyRefreshToken(payload.refreshToken);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (tokenPayload.type !== 'refresh') {
            throw new UnauthorizedException('Invalid token type');
        }

        const session = await this.prisma.userSession.findUnique({
            where: {
                id: tokenPayload.sessionId,
            },
            select: {
                id: true,
                userId: true,
                refreshTokenHash: true,
                revokedAt: true,
                expiresAt: true,
            },
        });

        if (!session) {
            throw new UnauthorizedException('Session topilmadi');
        }

        if (session.userId !== tokenPayload.id) {
            throw new UnauthorizedException('Session userga tegishli emas');
        }

        if (session.revokedAt) {
            return {
                success: true,
                message: 'Already logged out',
            };
        }

        if (session.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token expired');
        }

        const isRefreshTokenValid = await this.bcrypt.comparePasswords(
            payload.refreshToken,
            session.refreshTokenHash,
        );

        if (!isRefreshTokenValid) {
            throw new UnauthorizedException('Refresh token invalid');
        }

        await this.prisma.userSession.update({
            where: {
                id: session.id,
            },
            data: {
                revokedAt: new Date(),
            },
        });

        return {
            success: true,
            message: 'Logged out successfully',
        };
    }

    async getAllSessions() {
        const sessions = await this.prisma.userSession.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                userId: true,
                ipAddress: true,
                userAgent: true,
                deviceName: true,
                expiresAt: true,
                revokedAt: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });

        return {
            success: true,
            sessions: sessions.map((session) => ({
                id: session.id,
                userId: session.userId,
                user: session.user,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                deviceName: session.deviceName,
                expiresAt: session.expiresAt,
                revokedAt: session.revokedAt,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                isActive: !session.revokedAt && session.expiresAt > new Date(),
            })),
        };
    }

    private async issueTokens(
        user: {
            id: number;
            phone: string;
            email: string | null;
            role: string;
        },
        req?: any,
    ) {
        // Access token API requestlar uchun ishlatiladi:
        // /auth/me, /profile, /booking va hokazo.


        // Requestdan IP, userAgent va deviceName olamiz.
        // Bu session history va logout all devices uchun kerak bo‘ladi.
        const sessionMeta = this.getSessionMeta(req);

        // Avval session yaratamiz.
        // refreshTokenHash vaqtincha PENDING, chunki refreshToken session.id bilan yaratiladi.
        const session = await this.prisma.userSession.create({
            data: {
                userId: user.id,
                refreshTokenHash: 'PENDING',
                ipAddress: sessionMeta.ipAddress,
                userAgent: sessionMeta.userAgent,
                deviceName: sessionMeta.deviceName,
                expiresAt: this.getRefreshExpiresAt(),
            },
            select: {
                id: true,
            },
        });

        // Refresh token ichiga sessionId qo‘shamiz.
        // Keyin /auth/refresh yoki /auth/logout kelganda shu sessionni topamiz.
        const refreshToken = this.jwt.generateRefreshToken({
            id: user.id,
            sessionId: session.id,
            type: 'refresh',
        });

        // Refresh tokenni DBga ochiq saqlamaymiz.
        // Password kabi hash qilib saqlaymiz.

        // Hullas bu yerda Biz sessionIdni berdik chunki qaysi device ekanligini bilishi kere AuthGuard
        const accessToken = this.jwt.generateAccessToken({
            id: user.id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            sessionId: session.id
        });
        const refreshTokenHash = await this.bcrypt.generateHashPass(refreshToken);

        await this.prisma.userSession.update({
            where: {
                id: session.id,
            },
            data: {
                refreshTokenHash,
            },
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    private getSessionMeta(req?: any) {
        const userAgent = req?.headers?.['user-agent'] || null;
        const forwardedFor = req?.headers?.['x-forwarded-for'];

        const ipAddress =
            typeof forwardedFor === 'string'
                ? forwardedFor.split(',')[0].trim()
                : req?.ip || req?.socket?.remoteAddress || null;

        return {
            ipAddress,
            userAgent,
            deviceName: this.getDeviceName(userAgent),
        };
    }

    private getDeviceName(userAgent?: string | null) {
        if (!userAgent) {
            return null;
        }

        let browser = 'Unknown Browser';
        let os = 'Unknown OS';

        if (userAgent.includes('Edg')) {
            browser = 'Edge';
        } else if (userAgent.includes('Chrome')) {
            browser = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
        } else if (userAgent.includes('Safari')) {
            browser = 'Safari';
        }

        if (userAgent.includes('Windows')) {
            os = 'Windows';
        } else if (userAgent.includes('Android')) {
            os = 'Android';
        } else if (userAgent.includes('iPhone')) {
            os = 'iPhone';
        } else if (userAgent.includes('Mac OS')) {
            os = 'MacOS';
        } else if (userAgent.includes('Linux')) {
            os = 'Linux';
        }

        return `${browser} ${os}`;
    }

    private getRefreshExpiresAt() {
        const refreshTokenExpireDate = this.config.get<string>(
            'JWT_REFRESH_EXPIRES_IN',
            '7d',
        );

        const days = Number(refreshTokenExpireDate.split('d')[0]);
        const safeDays = Number.isNaN(days) ? 7 : days;

        return new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
    }

    private checkUserStatus(status: string) {
        if (status === 'ACTIVE') {
            return;
        }

        if (status === 'INACTIVE') {
            throw new ForbiddenException('Account is inactive');
        }

        if (status === 'BANNED') {
            throw new ForbiddenException('Account is banned');
        }

        if (status === 'DELETED') {
            throw new ForbiddenException('Account is deleted');
        }

        throw new ForbiddenException('Account is not allowed');
    }

    private normalizePhone(phone: string) {
        const digits = phone.replace(/\D/g, '');

        if (digits.startsWith('998')) {
            return `+${digits}`;
        }

        if (digits.length === 9) {
            return `+998${digits}`;
        }

        return `+${digits}`;
    }

    private normalizeEmail(email?: string) {
        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanEmail) {
            return undefined;
        }

        return cleanEmail;
    }

    private safeUserSelect() {
        return {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            role: true,
            status: true,
            profile: {
                select: {
                    isCompleted: true,
                },
            },
        };
    }

    private formatAuthUser(user: any) {
        return {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            role: user.role,
            status: user.status,
            profileCompleted: user.profile?.isCompleted ?? false,
        };
    }
}