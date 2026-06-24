import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from 'src/common/decorators/role';

import { VehicleMaintenceService } from './vehicle-maintence.service';
import { CreateVehicleMaintenanceDto } from './dto/create-vehicle-maintence.dto';
import { UpdateVehicleMaintenceDto } from './dto/update-vehicle-maintence.dto';
import { GetVehicleMaintenencesQueryDto } from './dto/filter-dto';
import { RoleGuard } from 'src/common/guards/role.guard';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('Vehicle Maintenances')
@ApiBearerAuth()
@UseGuards(AuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('admin/vehicle-maintenances')
export class VehicleMaintenceController {
  constructor(
    private readonly vehicleMaintenceService: VehicleMaintenceService,
  ) {}

  @Get("all")
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} vehicle maintenances list`,
  })
  getVehicleMaintenences(@Query() query: GetVehicleMaintenencesQueryDto) {
    return this.vehicleMaintenceService.getVehicleMaintenences(query);
  }

  @Get('one/:id')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} vehicle maintenance detail`,
  })
  getVehicleMaintenceById(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleMaintenceService.getVehicleMaintenceById(id);
  }

  @Post("create")
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} create vehicle maintenance`,
  })
  createVehicleMaintenance(@Body() payload: CreateVehicleMaintenanceDto) {
    return this.vehicleMaintenceService.createVehicleMaintenance(payload);
  }

  @Patch('update/:id')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} update vehicle maintenance`,
  })
  updateVehicleMaintence(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateVehicleMaintenceDto,
  ) {
    return this.vehicleMaintenceService.updateVehicleMaintence(id, payload);
  }
}