import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/core/prisma/prisma.service';
import {
  deleteFile,
  deleteUploadedFile,
} from 'src/common/functions/multer-file-upload';

import { CreateArenaDto } from './dto/create-arena.dto';
import { ActiveOrDisactiveArenaDto, UpdateArenaDto } from './dto/update-arena.dto';
import { GetArenasQueryDto, PublicArenasQueryDto } from './dto/filter-dto';


@Injectable()
export class ArenasService {
  constructor(private readonly prisma: PrismaService) { }

  async getPublicArenas(query: PublicArenasQueryDto) {
    let { page, limit } = query;

    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    const where: Prisma.ArenaWhereInput = {
      isActive: true,
    };

    const [arenas, total] = await this.prisma.$transaction([
      this.prisma.arena.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: this.arenaListSelect(),
      }),
      this.prisma.arena.count({ where }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      success: true,
      message: 'Arenas fetched successfully',
      data: arenas.map((arena) => this.formatPublicArena(arena)),
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

  async getPublicArenaById(id: number) {
    const arena = await this.prisma.arena.findFirst({
      where: {
        id,
        isActive: true,
      },
      select: this.arenaDetailSelect(true),
    });

    if (!arena) {
      throw new NotFoundException('Arena not found');
    }

    return {
      success: true,
      message: 'Arena fetched successfully',
      arena: this.formatPublicArenaDetail(arena),
    };
  }

  async getAdminArenas(query: GetArenasQueryDto) {
    let {
      page,
      limit,
      search,
      city,
      isActive,
      sortBy,
      sortOrder,
    } = query;

    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    search = search?.trim();
    city = city?.trim();

    sortBy = sortBy ?? 'createdAt';
    sortOrder = sortOrder ?? 'desc';

    const where: Prisma.ArenaWhereInput = {
      ...(isActive !== undefined && { isActive }),

      ...(city
        ? {
          city: {
            contains: city,
            mode: 'insensitive',
          },
        }
        : {}),

      ...(search
        ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
        : {}),
    };

    const [arenas, total] = await this.prisma.$transaction([
      this.prisma.arena.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: this.arenaListSelect(),
      }),
      this.prisma.arena.count({ where }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      success: true,
      message: 'Admin arenas fetched successfully',
      data: arenas.map((arena) => this.formatAdminArena(arena)),
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

  async getAdminArenaById(id: number) {
    const arena = await this.prisma.arena.findUnique({
      where: { id },
      select: this.arenaDetailSelect(false),
    });

    if (!arena) {
      throw new NotFoundException('Arena not found');
    }

    return {
      success: true,
      message: 'Arena fetched successfully',
      arena: this.formatAdminArenaDetail(arena),
    };
  }

  async createArena(payload: CreateArenaDto, file?: Express.Multer.File) {
    const slug = payload.slug
      ? this.createSlug(payload.slug)
      : await this.createUniqueSlug(payload.name);

    try {
      const arena = await this.prisma.arena.create({
        data: {
          name: payload.name,
          slug,
          address: payload.address,
          city: payload.city,
          description: payload.description,
          coverImageUrl: payload.coverImageUrl,
          isActive: payload.isActive ?? true,
          sortOrder: payload.sortOrder ?? 0,
        },
        select: this.arenaDetailSelect(false),
      });

      return {
        success: true,
        message: 'Arena created successfully',
        arena: this.formatAdminArenaDetail(arena),
      };
    } catch (error: any) {
      await deleteUploadedFile(file);

      if (error?.code === 'P2002') {
        throw new ConflictException('Arena slug already exists');
      }

      throw error;
    }
  }

  async updateArena(
    id: number,
    payload: UpdateArenaDto,
    file?: Express.Multer.File,
  ) {
    const oldArena = await this.prisma.arena.findUnique({
      where: { id },
      select: {
        id: true,
        coverImageUrl: true,
      },
    });

    if (!oldArena) {
      await deleteUploadedFile(file);
      throw new NotFoundException('Arena not found');
    }

    const slug = payload.slug
      ? this.createSlug(payload.slug)
      : payload.name
        ? await this.createUniqueSlug(payload.name, id)
        : undefined;

    try {
      const arena = await this.prisma.arena.update({
        where: { id },
        data: {
          ...(payload.name !== undefined && {
            name: payload.name,
          }),

          ...(slug !== undefined && {
            slug,
          }),

          ...(payload.address !== undefined && {
            address: payload.address,
          }),

          ...(payload.city !== undefined && {
            city: payload.city,
          }),

          ...(payload.description !== undefined && {
            description: payload.description,
          }),

          ...(payload.coverImageUrl !== undefined && {
            coverImageUrl: payload.coverImageUrl,
          }),

          ...(payload.isActive !== undefined && {
            isActive: payload.isActive,
          }),

          ...(payload.sortOrder !== undefined && {
            sortOrder: payload.sortOrder,
          }),
        },
        select: this.arenaDetailSelect(false),
      });

      if (file && oldArena.coverImageUrl) {
        await deleteFile(oldArena.coverImageUrl);
      }

      return {
        success: true,
        message: 'Arena updated successfully',
        arena: this.formatAdminArenaDetail(arena),
      };
    } catch (error: any) {
      await deleteUploadedFile(file);

      if (error?.code === 'P2002') {
        throw new ConflictException('Arena slug already exists');
      }

      throw error;
    }
  }

  async activeOrDisactiveArena(
    id: number,
    payload: ActiveOrDisactiveArenaDto,
  ) {
    const arena = await this.prisma.arena.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!arena) {
      throw new NotFoundException('Arena not found');
    }

    if (arena.isActive === payload.isActive) {
      return {
        success: true,
        message: payload.isActive
          ? 'Arena already active'
          : 'Arena already disactive',
      };
    }

    const updatedArena = await this.prisma.arena.update({
      where: { id },
      data: {
        isActive: payload.isActive,
      },
      select: this.arenaDetailSelect(false),
    });

    return {
      success: true,
      message: payload.isActive
        ? 'Arena activated successfully'
        : 'Arena disactivated successfully',
      arena: this.formatAdminArenaDetail(updatedArena),
    };
  }

  private createSlug(value: string): string {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/['‘’`]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'arena';
  }

  private async createUniqueSlug(name: string, ignoreId?: number): Promise<string> {
    const baseSlug = this.createSlug(name);

    let slug = baseSlug;
    let counter = 1;

    let existingArena = await this.prisma.arena.findFirst({
      where: {
        slug,
        ...(ignoreId !== undefined && {
          id: {
            not: ignoreId,
          },
        }),
      },
      select: {
        id: true,
      },
    });

    while (existingArena) {
      slug = `${baseSlug}-${counter}`;
      counter++;

      existingArena = await this.prisma.arena.findFirst({
        where: {
          slug,
          ...(ignoreId !== undefined && {
            id: {
              not: ignoreId,
            },
          }),
        },
        select: {
          id: true,
        },
      });
    }

    return slug;
  }

  private arenaListSelect(): Prisma.ArenaSelect {
    return {
      id: true,
      name: true,
      slug: true,
      address: true,
      city: true,
      description: true,
      coverImageUrl: true,
      isActive: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          trackLayouts: true,
          zones: true,
        },
      },
    };
  }

  private arenaDetailSelect(publicOnly: boolean): Prisma.ArenaSelect {
    return {
      id: true,
      name: true,
      slug: true,
      address: true,
      city: true,
      description: true,
      coverImageUrl: true,
      isActive: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,

      trackLayouts: {
        ...(publicOnly && {
          where: {
            isActive: true,
          },
        }),
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        select: {
          id: true,
          arenaId: true,
          categoryId: true,
          name: true,
          slug: true,
          description: true,
          lengthMeters: true,
          difficulty: true,
          imageUrl: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              isActive: true,
            },
          },
        },
      },

      zones: {
        ...(publicOnly && {
          where: {
            isActive: true,
          },
        }),
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        select: {
          id: true,
          arenaId: true,
          trackLayoutId: true,
          name: true,
          description: true,
          zoneType: true,
          imageUrl: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    };
  }

  private formatArenaBase(arena: any) {
    return {
      id: arena.id,
      name: arena.name,
      slug: arena.slug,
      address: arena.address,
      city: arena.city,
      description: arena.description,
      coverImageUrl: arena.coverImageUrl,
      sortOrder: arena.sortOrder,
      createdAt: arena.createdAt,
      updatedAt: arena.updatedAt,
    };
  }

  private formatPublicArena(arena: any) {
    return {
      ...this.formatArenaBase(arena),
      trackLayoutsCount: arena._count?.trackLayouts ?? 0,
      zonesCount: arena._count?.zones ?? 0,
    };
  }

  private formatAdminArena(arena: any) {
    return {
      ...this.formatArenaBase(arena),
      isActive: arena.isActive,
      trackLayoutsCount: arena._count?.trackLayouts ?? 0,
      zonesCount: arena._count?.zones ?? 0,
    };
  }

  private formatPublicArenaDetail(arena: any) {
    return {
      ...this.formatArenaBase(arena),
      trackLayouts: arena.trackLayouts,
      zones: arena.zones,
    };
  }

  private formatAdminArenaDetail(arena: any) {
    return {
      ...this.formatArenaBase(arena),
      isActive: arena.isActive,
      trackLayouts: arena.trackLayouts,
      zones: arena.zones,
    };
  }
}