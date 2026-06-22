import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VehicleStatus } from '@prisma/client';

import { PrismaService } from 'src/core/prisma/prisma.service';
import { deleteFile, deleteUploadedFile } from 'src/common/functions/multer-file-upload';

import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { GetVehiclesQueryDto, PublicVehiclesQueryDto } from './dto/filters-dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) { }


  async getPublicVehicleById(id: number) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        isActive: true,
        status: VehicleStatus.AVAILABLE,
        category: {
          isActive: true,
        },
      },
      select: this.vehicleSelect(),
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return {
      success: true,
      message: 'Vehicle fetched successfully',
      vehicle: this.formatPublicVehicle(vehicle),
    };
  }

  async getAdminVehicleById(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: this.vehicleSelect(),
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return {
      success: true,
      message: 'Vehicle fetched successfully',
      vehicle: this.formatAdminVehicle(vehicle),
    };
  }

  async getAdminVehicles(query: GetVehiclesQueryDto) {
    let {
      page,
      limit,
      search,
      categorySlug,
      categoryName,
      status,
      difficulty,
      controlType,
      isActive,
      sortBy,
      sortOrder,
    } = query;

    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (page - 1) * limit;
    search = search?.trim();

    sortBy = sortBy ?? 'createdAt';
    sortOrder = sortOrder ?? 'desc';

    const where: Prisma.VehicleWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(status !== undefined && { status }),
      ...(difficulty !== undefined && { difficulty }),
      ...(controlType !== undefined && { controlType }),

      ...(categorySlug || categoryName
        ? {
          category: {
            ...(categorySlug ? { slug: categorySlug } : {}),

            ...(categoryName
              ? {
                name: {
                  contains: categoryName,
                  mode: 'insensitive',
                },
              }
              : {}),
          },
        }
        : {}),

      ...(search
        ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            {
              category: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
            {
              category: {
                slug: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        }
        : {}),
    };

    const [vehicles, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: this.vehicleSelect(),
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      success: true,
      message: 'Admin vehicles fetched successfully',
      data: vehicles.map((vehicle) => this.formatAdminVehicle(vehicle)),
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

  async getPublicVehicles(query: PublicVehiclesQueryDto) {
    let { page, limit } = query;

    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    const where: Prisma.VehicleWhereInput = {
      isActive: true,
      category: {
        isActive: true
      },
    };

    const [vehicles, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: this.vehicleSelect(),
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      success: true,
      message: 'Vehicles fetched successfully',
      data: vehicles.map((vehicle) => this.formatPublicVehicle(vehicle)),
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

  async createVehicle(
    payload: CreateVehicleDto,
    file?: Express.Multer.File,
  ) {
    const category = await this.prisma.racingCategory.findFirst({
      where: {
        id: payload.categoryId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!category) {
      await deleteUploadedFile(file);
      throw new NotFoundException('Category not found or inactive');
    }

    if (payload.status === VehicleStatus.RESERVED) {
      await deleteUploadedFile(file);
      throw new BadRequestException(
        'Vehicle cannot be created with RESERVED status',
      );
    }

    const slug = payload.slug
      ? this.createSlug(payload.slug)
      : await this.createUniqueSlug(payload.name);

    try {
      const vehicle = await this.prisma.vehicle.create({
        data: {
          categoryId: payload.categoryId,
          name: payload.name,
          slug,
          imageUrl: payload.imageUrl,

          topSpeedKmh: payload.topSpeedKmh,
          batteryLifeMinutes: payload.batteryLifeMinutes,
          controlType: payload.controlType,
          difficulty: payload.difficulty,
          status: payload.status ?? VehicleStatus.AVAILABLE,

          description: payload.description,
          sortOrder: payload.sortOrder ?? 0,
        }
      });

      return {
        success: true,
        message: 'Vehicle created successfully',
      };
    } catch (error: any) {
      await deleteUploadedFile(file);

      if (error?.code === 'P2002') {
        throw new ConflictException('Vehicle slug already exists');
      }

      if (error?.code === 'P2003') {
        throw new BadRequestException('Invalid category selected');
      }

      throw error;
    }
  }

  async updateVehicle(
    id: number,
    payload: UpdateVehicleDto,
    file?: Express.Multer.File,
  ) {
    const oldVehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        imageUrl: true,
        status: true,
        isActive: true,
      },
    });

    if (!oldVehicle) {
      await deleteUploadedFile(file);
      throw new NotFoundException('Vehicle not found');
    }

    if (payload.categoryId !== undefined) {
      const category = await this.prisma.racingCategory.findFirst({
        where: {
          id: payload.categoryId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!category) {
        await deleteUploadedFile(file);
        throw new NotFoundException('Category not found or inactive');
      }
    }


    if (payload.status === VehicleStatus.RESERVED) {
      await deleteUploadedFile(file);
      throw new BadRequestException(
        'Vehicle status cannot be manually changed to RESERVED',
      );
    }

    const slug = payload.slug
      ? this.createSlug(payload.slug)
      : payload.name
        ? await this.createUniqueSlug(payload.name, id)
        : undefined;

    const nextIsActive =
      payload.status === VehicleStatus.DISABLED ? false : payload.isActive;

    try {
      const vehicle = await this.prisma.vehicle.update({
        where: { id },
        data: {
          ...(payload.categoryId !== undefined && {
            categoryId: payload.categoryId,
          }),

          ...(payload.name !== undefined && {
            name: payload.name,
          }),

          ...(slug !== undefined && {
            slug,
          }),

          ...(payload.imageUrl !== undefined && {
            imageUrl: payload.imageUrl,
          }),

          ...(payload.topSpeedKmh !== undefined && {
            topSpeedKmh: payload.topSpeedKmh,
          }),

          ...(payload.batteryLifeMinutes !== undefined && {
            batteryLifeMinutes: payload.batteryLifeMinutes,
          }),

          ...(payload.controlType !== undefined && {
            controlType: payload.controlType,
          }),

          ...(payload.difficulty !== undefined && {
            difficulty: payload.difficulty,
          }),

          ...(payload.status !== undefined && {
            status: payload.status,
          }),

          ...(payload.description !== undefined && {
            description: payload.description,
          }),

          ...(nextIsActive !== undefined && {
            isActive: nextIsActive,
          }),

          ...(payload.sortOrder !== undefined && {
            sortOrder: payload.sortOrder,
          }),
        },
        select: this.vehicleSelect(),
      });

      if (file && oldVehicle.imageUrl) {
        await deleteFile(oldVehicle.imageUrl);
      }

      return {
        success: true,
        message: 'Vehicle updated successfully',
      };
    } catch (error: any) {
      await deleteUploadedFile(file);

      if (error?.code === 'P2002') {
        throw new ConflictException('Vehicle slug already exists');
      }

      if (error?.code === 'P2003') {
        throw new BadRequestException('Invalid category selected');
      }

      throw error;
    }
  }

  async disableVehicle(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
        status: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (!vehicle.isActive && vehicle.status === VehicleStatus.DISABLED) {
      return {
        success: true,
        message: 'Vehicle already disabled',
      };
    }

    await this.prisma.vehicle.update({
      where: { id },
      data: {
        isActive: false,
        status: VehicleStatus.DISABLED,
      },
    });

    return {
      success: true,
      message: 'Vehicle disabled successfully',
    };
  }

  private createSlug(value: string) {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/['‘’`]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'vehicle';
  }

  private async createUniqueSlug(name: string, ignoreId?: number) {
    const baseSlug = this.createSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (
      await this.prisma.vehicle.findFirst({
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
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private formatAdminVehicle(vehicle: any) {
    return {
      id: vehicle.id,
      categoryId: vehicle.categoryId,
      name: vehicle.name,
      slug: vehicle.slug,
      imageUrl: vehicle.imageUrl,
      topSpeedKmh: vehicle.topSpeedKmh,
      batteryLifeMinutes: vehicle.batteryLifeMinutes,
      controlType: vehicle.controlType,
      difficulty: vehicle.difficulty,
      status: vehicle.status,
      description: vehicle.description,
      sortOrder: vehicle.sortOrder,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
      category: vehicle.category,
    };
  }

  private vehicleSelect() {
    return {
      id: true,
      categoryId: true,
      name: true,
      slug: true,
      imageUrl: true,
      topSpeedKmh: true,
      batteryLifeMinutes: true,
      controlType: true,
      difficulty: true,
      status: true,
      description: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          speedRange: true,
          trackType: true,
          isActive: true,
        },
      },
    } satisfies Prisma.VehicleSelect;
  }

  private formatPublicVehicle(vehicle: any) {
    return {
      id: vehicle.id,
      categoryId: vehicle.categoryId,
      name: vehicle.name,
      slug: vehicle.slug,
      imageUrl: vehicle.imageUrl,
      topSpeedKmh: vehicle.topSpeedKmh,
      batteryLifeMinutes: vehicle.batteryLifeMinutes,
      controlType: vehicle.controlType,
      difficulty: vehicle.difficulty,
      status: vehicle.status,
      description: vehicle.description,
      sortOrder: vehicle.sortOrder,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
      category: {
        id: vehicle.category.id,
        name: vehicle.category.name,
        slug: vehicle.category.slug,
        imageUrl: vehicle.category.imageUrl,
        speedRange: vehicle.category.speedRange,
        trackType: vehicle.category.trackType,
      },
    };
  }

}