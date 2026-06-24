import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, Status } from '@prisma/client';

import { PrismaService } from 'src/core/prisma/prisma.service';
import { BcryptUtilsService } from 'src/common/utils/bcrypt.service';
import {
  deleteFile,
  deleteUploadedFile,
} from 'src/common/functions/multer-file-upload';

import { GetUsersQueryDto } from './dto/filters.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { AuthUser } from 'src/common/types/auth.user.type';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptUtilsService,
  ) {}

  async getAllUsers(query: GetUsersQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const search = query.search?.trim();

    const where: Prisma.UserWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.role ? { role: query.role } : {}),

      ...(search
        ? {
            OR: [
              {
                fullName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                phone: {
                  contains: search,
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: this.userListSelect(),
      }),

      this.prisma.user.count({
        where,
      }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      success: true,
      data: users.map((user) => this.formatUserListItem(user)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getUserById(id: number, currentUser: AuthUser) {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isSuperAdmin = currentUser.role === UserRole.SUPERADMIN;
    const isSelf = currentUser.id === id;

    if (!isSelf && !isAdmin && !isSuperAdmin) {
      throw new ForbiddenException("Siz faqat o'zingizni ko'ra olasiz");
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: this.userDetailSelect(),
    });

    if (!user) {
      throw new NotFoundException('User topilmadi');
    }

    return {
      success: true,
      user,
    };
  }

  async createUser(
    payload: CreateUserDto,
    currentUser: AuthUser,
    file?: Express.Multer.File,
  ) {
    try {
      this.checkRoleManagePermission(payload.role, currentUser);

      const fullName = payload.fullName.trim();
      const phone = this.normalizePhone(payload.phone);
      const email = this.normalizeEmail(payload.email);

      await this.checkUniquePhoneAndEmail(phone, email);

      const passwordHash = await this.bcrypt.generateHashPass(payload.password);

      await this.prisma.user.create({
        data: {
          fullName,
          phone,
          email,
          passwordHash,
          avatarUrl: payload.avatarUrl,
          role: payload.role,

          profile: {
            create: {
              avatarUrl: payload.avatarUrl,
              isCompleted: false,
            },
          },
        },
      });

      return {
        success: true,
        message: 'User created successfully. User can login with phone and password.',
      };
    } catch (error: any) {
      await deleteUploadedFile(file);

      if (error?.code === 'P2002') {
        const target = error?.meta?.target ?? [];

        if (target.includes('phone') || target.includes('email')) {
          throw new ConflictException('Phone or email already used');
        }
      }

      if (
        error instanceof ConflictException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('User create failed');
    }
  }

  async updateUser(
    id: number,
    payload: UpdateUserDto,
    currentUser: AuthUser,
    file?: Express.Multer.File,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
        status: true,
        avatarUrl: true,
        profile: {
          select: {
            avatarUrl: true,
          },
        },
      },
    });

    if (!existingUser) {
      await deleteUploadedFile(file);
      throw new NotFoundException('User topilmadi');
    }

    try {
      const isSelf = currentUser.id === id;
      const isAdmin = currentUser.role === UserRole.ADMIN;
      const isSuperAdmin = currentUser.role === UserRole.SUPERADMIN;

      if (!isSelf && !isAdmin && !isSuperAdmin) {
        throw new ForbiddenException("Siz faqat o'zingizni update qila olasiz");
      }

      if (
        currentUser.role === UserRole.ADMIN &&
        existingUser.role === UserRole.SUPERADMIN
      ) {
        throw new ForbiddenException('Admin superadmin userni update qila olmaydi');
      }

      if (isSelf) {
        if (payload.role) {
          throw new ForbiddenException("O'zingizni role o'zgartira olmaysiz");
        }

        if (payload.status) {
          throw new ForbiddenException("O'zingizni status o'zgartira olmaysiz");
        }
      }

      if (payload.role) {
        this.checkRoleManagePermission(payload.role, currentUser);
      }

      const fullName = payload.fullName?.trim();
      const phone = payload.phone ? this.normalizePhone(payload.phone) : undefined;

      const email =
        payload.email !== undefined ? this.normalizeEmail(payload.email) : undefined;

      if (phone || email) {
        await this.checkUniquePhoneAndEmail(phone, email, id);
      }

      const passwordHash = payload.password
        ? await this.bcrypt.generateHashPass(payload.password)
        : undefined;

      const data: Prisma.UserUpdateInput = {
        ...(fullName ? { fullName } : {}),
        ...(phone ? { phone } : {}),
        ...(payload.email !== undefined ? { email } : {}),
        ...(passwordHash ? { passwordHash } : {}),
        ...(payload.role ? { role: payload.role } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),

        ...(payload.avatarUrl !== undefined
          ? {
              profile: {
                upsert: {
                  create: {
                    avatarUrl: payload.avatarUrl,
                    isCompleted: false,
                  },
                  update: {
                    avatarUrl: payload.avatarUrl,
                  },
                },
              },
            }
          : {}),

        ...(payload.status === Status.DELETED ? { deletedAt: new Date() } : {}),

        ...(payload.status && payload.status !== Status.DELETED
          ? { deletedAt: null }
          : {}),
      };

      await this.prisma.user.update({
        where: {
          id,
        },
        data,
      });

      if (file && existingUser.avatarUrl) {
        await deleteFile(existingUser.avatarUrl).catch(() => undefined);
      }

      if (
        file &&
        existingUser.profile?.avatarUrl &&
        existingUser.profile.avatarUrl !== existingUser.avatarUrl
      ) {
        await deleteFile(existingUser.profile.avatarUrl).catch(() => undefined);
      }

      return {
        success: true,
        message: 'User updated successfully',
      };
    } catch (error: any) {
      await deleteUploadedFile(file);

      if (error?.code === 'P2002') {
        const target = error?.meta?.target ?? [];

        if (target.includes('phone') || target.includes('email')) {
          throw new ConflictException('Phone or email already used');
        }
      }

      if (
        error instanceof ConflictException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('User update failed');
    }
  }

  async deleteUser(id: number, currentUser: AuthUser) {
    if (currentUser.id === id) {
      throw new ForbiddenException("O'zingizni delete qila olmaysiz");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User topilmadi');
    }

    this.checkDeletePermission(existingUser, currentUser);

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        status: Status.DELETED,
        deletedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  private checkDeletePermission(
    targetUser: {
      id: number;
      role: UserRole;
      status: Status;
    },
    currentUser: AuthUser,
  ) {
    if (currentUser.role === UserRole.SUPERADMIN) {
      return;
    }

    if (currentUser.role === UserRole.ADMIN) {
      if (
        targetUser.role === UserRole.SUPERADMIN ||
        targetUser.role === UserRole.ADMIN
      ) {
        throw new ForbiddenException(
          'Admin superadmin yoki admin userni delete qila olmaydi',
        );
      }

      return;
    }

    throw new ForbiddenException("Sizda user delete qilish huquqi yo'q");
  }

  private checkRoleManagePermission(role: UserRole, currentUser: AuthUser) {
    if (role === UserRole.SUPERADMIN) {
      throw new ForbiddenException('Superadmin role API orqali berilmaydi');
    }

    if (currentUser.role === UserRole.SUPERADMIN) {
      return;
    }

    if (role === UserRole.ADMIN) {
      throw new ForbiddenException('Admin role faqat superadmin tomonidan beriladi');
    }

    if (
      role === UserRole.OPERATOR ||
      role === UserRole.TEAM_MANAGER ||
      role === UserRole.RACER
    ) {
      if (
        currentUser.role !== UserRole.ADMIN &&
        currentUser.role !== UserRole.SUPERADMIN
      ) {
        throw new ForbiddenException(
          'Operator, team manager yoki racer role faqat admin yoki superadmin tomonidan beriladi',
        );
      }

      return;
    }

    throw new ForbiddenException('Bu role users API orqali berilmaydi');
  }

  private async checkUniquePhoneAndEmail(
    phone?: string,
    email?: string,
    ignoreUserId?: number,
  ) {
    if (!phone && !email) {
      return;
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        ...(ignoreUserId
          ? {
              id: {
                not: ignoreUserId,
              },
            }
          : {}),

        OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])],
      },
      select: {
        id: true,
        phone: true,
        email: true,
      },
    });

    if (!existingUser) {
      return;
    }

    if (phone && existingUser.phone === phone) {
      throw new ConflictException('Phone number already used');
    }

    if (email && existingUser.email === email) {
      throw new ConflictException('Email already used');
    }

    throw new ConflictException('User already exists');
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

  private userListSelect(): Prisma.UserSelect {
    return {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      avatarUrl: true,
      role: true,
      status: true,
      lastLoginAt: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,

      profile: {
        select: {
          id: true,
          nickname: true,
          avatarUrl: true,
          bio: true,
          experienceLevel: true,
          isCompleted: true,
        },
      },

      _count: {
        select: {
          userSessions: true,
        },
      },
    };
  }

  private userDetailSelect(): Prisma.UserSelect {
    return {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      avatarUrl: true,
      role: true,
      status: true,
      lastLoginAt: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,

      profile: {
        select: {
          id: true,
          nickname: true,
          avatarUrl: true,
          bio: true,
          experienceLevel: true,
          isCompleted: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      userSessions: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          ipAddress: true,
          deviceName: true,
          expiresAt: true,
          revokedAt: true,
          createdAt: true,
        },
      },
    };
  }

  private formatUserListItem(user: any) {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile,
      sessionCount: user._count.userSessions,
    };
  }
}