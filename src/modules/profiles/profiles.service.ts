import { Injectable, NotFoundException } from '@nestjs/common';
import { ExperienceLevel, Prisma, Status } from '@prisma/client';

import { PrismaService } from 'src/core/prisma/prisma.service';
import type { AuthUser } from 'src/common/types/auth.user.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { deleteUploadedFile } from 'src/common/functions/multer-file-upload';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) { }

  async getMyProfile(currentUser: AuthUser) {
    const profile = await this.prisma.profile.upsert({
      where: {
        userId: currentUser.id,
      },
      update: {},
      create: {
        userId: currentUser.id,
      },
      select: this.profileSelect(),
    });

    return {
      success: true,
      profile,
    };
  }

  async updateMyProfile(
    payload: UpdateProfileDto,
    currentUser: AuthUser,
  ) {
    try {
      let profile = await this.prisma.profile.upsert({
        where: {
          userId: currentUser.id,
        },
        update: {
          ...(payload.nickname !== undefined
            ? { nickname: payload.nickname.trim() }
            : {}),

          ...(payload.bio !== undefined
            ? { bio: payload.bio.trim() }
            : {}),

          ...(payload.experienceLevel !== undefined
            ? { experienceLevel: payload.experienceLevel }
            : {}),

          ...(payload.avatarUrl ? { avatarUrl: payload.avatarUrl } : {}),
        },
        create: {
          userId: currentUser.id,
          nickname: payload.nickname?.trim(),
          bio: payload.bio?.trim(),
          experienceLevel: payload.experienceLevel,
          avatarUrl: payload.avatarUrl,
        },
      });

      const isCompleted = Boolean(profile.avatarUrl && profile.nickname && profile.experienceLevel);

      if (profile.isCompleted !== isCompleted) {
        profile = await this.prisma.profile.update({
          where: {
            id: profile.id,
          },
          data: {
            isCompleted,
          },
        });
      }

      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
     if(payload.avatarUrl){ 
      await deleteUploadedFile()}

      throw error
    }
  }

  async getProfileByUserId(userId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId,
      },
      select: this.profileSelect(),
    });

    if (!profile || profile.user.status === Status.DELETED) {
      throw new NotFoundException('Profile topilmadi');
    }

    return {
      success: true,
      profile
    };
  }

  private profileSelect() {
    return {
      id: true,
      userId: true,
      nickname: true,
      avatarUrl: true,
      bio: true,
      experienceLevel: true,
      isCompleted: true,
      createdAt: true,
      updatedAt: true,

      user: {
        select: {
          id: true,
          fullName: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
    };
  }
}