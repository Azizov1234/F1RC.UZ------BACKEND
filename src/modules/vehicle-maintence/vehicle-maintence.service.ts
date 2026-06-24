import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  VehicleMaintenanceStatus,
  VehicleStatus,
} from '@prisma/client';

import { PrismaService } from 'src/core/prisma/prisma.service';

import { CreateVehicleMaintenanceDto } from './dto/create-vehicle-maintence.dto';
import { UpdateVehicleMaintenceDto } from './dto/update-vehicle-maintence.dto';
import { GetVehicleMaintenencesQueryDto } from './dto/filter-dto';

@Injectable()
export class VehicleMaintenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getVehicleMaintenences(query: GetVehicleMaintenencesQueryDto) {
    let { page, limit, vehicleId, status, search, sortBy, sortOrder } = query;

    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    sortBy = sortBy ?? 'createdAt';
    sortOrder = sortOrder ?? 'desc';
    search = search?.trim();

    const where: Prisma.VehicleMaintenanceWhereInput = {
      ...(vehicleId !== undefined && { vehicleId }),
      ...(status !== undefined && { status }),

      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { reason: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
              {
                vehicle: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
              {
                vehicle: {
                  slug: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [maintenences, total] = await this.prisma.$transaction([
      this.prisma.vehicleMaintenance.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: this.vehicleMaintenanceSelect(),
      }),
      this.prisma.vehicleMaintenance.count({ where }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      success: true,
      message: 'Vehicle maintenances fetched successfully',
      data: maintenences,
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

  async getVehicleMaintenceById(id: number) {
    const maintence = await this.prisma.vehicleMaintenance.findUnique({
      where: { id },
      select: this.vehicleMaintenanceSelect(),
    });

    if (!maintence) {
      throw new NotFoundException('Vehicle maintenance not found');
    }

    return {
      success: true,
      message: 'Vehicle maintenance fetched successfully',
      maintenance: maintence,
    };
  }

  async createVehicleMaintenance(payload: CreateVehicleMaintenanceDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: payload.vehicleId },
      select: {
        id: true,
        isActive: true,
        status: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (!vehicle.isActive || vehicle.status === VehicleStatus.DISABLED) {
      throw new BadRequestException(
        'Disabled vehicle cannot be sent to maintenance',
      );
    }

    const activeMaintenance = await this.prisma.vehicleMaintenance.findFirst({
      where: {
        vehicleId: payload.vehicleId,
        status: {
          in: [
            VehicleMaintenanceStatus.OPEN,
            VehicleMaintenanceStatus.IN_PROGRESS,
          ],
        },
      },
      select: {
        id: true,
      },
    });

    if (activeMaintenance) {
      throw new BadRequestException('Vehicle already has active maintenance');
    }

    const [maintenance] = await this.prisma.$transaction([
      this.prisma.vehicleMaintenance.create({
        data: {
          vehicleId: payload.vehicleId,
          title: payload.title,
          reason: payload.reason,
          notes: payload.notes,
          status: VehicleMaintenanceStatus.OPEN,
          startedAt: new Date(),
        },
        select: this.vehicleMaintenanceSelect(),
      }),

      this.prisma.vehicle.update({
        where: { id: payload.vehicleId },
        data: {
          status: VehicleStatus.MAINTENANCE,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Vehicle maintenance created successfully',
      maintenance,
    };
  }

  async updateVehicleMaintence(
    id: number,
    payload: UpdateVehicleMaintenceDto,
  ) {
    const oldMaintence = await this.prisma.vehicleMaintenance.findUnique({
      where: { id },
      select: {
        id: true,
        vehicleId: true,
        status: true,
      },
    });

    if (!oldMaintence) {
      throw new NotFoundException('Vehicle maintenance not found');
    }

    const nextStatus = payload.status;
    const isClosing =
      nextStatus === VehicleMaintenanceStatus.RESOLVED ||
      nextStatus === VehicleMaintenanceStatus.CANCELLED;

    const isReopening =
      nextStatus === VehicleMaintenanceStatus.OPEN ||
      nextStatus === VehicleMaintenanceStatus.IN_PROGRESS;

    if (
      oldMaintence.status === VehicleMaintenanceStatus.RESOLVED ||
      oldMaintence.status === VehicleMaintenanceStatus.CANCELLED
    ) {
      throw new BadRequestException('Closed maintenance cannot be updated');
    }

    if (isReopening) {
      const activeMaintenance = await this.prisma.vehicleMaintenance.findFirst({
        where: {
          vehicleId: oldMaintence.vehicleId,
          id: {
            not: id,
          },
          status: {
            in: [
              VehicleMaintenanceStatus.OPEN,
              VehicleMaintenanceStatus.IN_PROGRESS,
            ],
          },
        },
        select: {
          id: true,
        },
      });

      if (activeMaintenance) {
        throw new BadRequestException('Vehicle already has active maintenance');
      }
    }

    const [maintence] = await this.prisma.$transaction([
      this.prisma.vehicleMaintenance.update({
        where: { id },
        data: {
          ...(payload.title !== undefined && {
            title: payload.title,
          }),

          ...(payload.reason !== undefined && {
            reason: payload.reason,
          }),

          ...(payload.notes !== undefined && {
            notes: payload.notes,
          }),

          ...(nextStatus !== undefined && {
            status: nextStatus,
          }),

          ...(isClosing && {
            resolvedAt: new Date(),
          }),
        },
        select: this.vehicleMaintenanceSelect(),
      }),

      this.prisma.vehicle.update({
        where: { id: oldMaintence.vehicleId },
        data: {
          status: isClosing
            ? VehicleStatus.AVAILABLE
            : VehicleStatus.MAINTENANCE,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Vehicle maintenance updated successfully',
      maintenance: maintence,
    };
  }

  private vehicleMaintenanceSelect() {
    return {
      id: true,
      vehicleId: true,
      title: true,
      reason: true,
      status: true,
      startedAt: true,
      resolvedAt: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      vehicle: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          status: true,
          isActive: true,
        },
      },
    } satisfies Prisma.VehicleMaintenanceSelect;
  }
}