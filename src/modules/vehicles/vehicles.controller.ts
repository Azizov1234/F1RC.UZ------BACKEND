import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from 'src/common/decorators/role';
import {
  getImageUploadOptions,
  getUploadedFileUrl,
} from 'src/common/functions/multer-file-upload';

import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import {
  GetVehiclesQueryDto,
  PublicVehiclesQueryDto,
} from './dto/filters-dto';

@ApiTags('Vehicles')
@Controller()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) { }

  @Get()
  @ApiOperation({ summary: 'Public vehicles list' })
  getPublicVehicles(@Query() query: PublicVehiclesQueryDto) {
    return this.vehiclesService.getPublicVehicles(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Public vehicle detail' })
  getPublicVehicleById(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.getPublicVehicleById(id);
  }

  @Get('admin')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} vehicles list`,
  })
  getAdminVehicles(@Query() query: GetVehiclesQueryDto) {
    return this.vehiclesService.getAdminVehicles(query);
  }

  @Get('admin/:id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} vehicle detail`,
  })
  getAdminVehicleById(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.getAdminVehicleById(id);
  }

  @Post('admin')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateVehicleDto })
  @UseInterceptors(
    FileInterceptor(
      'imageUrl',
      getImageUploadOptions({
        folder: 'vehicles',
        prefix: 'vehicle',
        maxSizeMb: 10,
      }) as any,
    ),
  )
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} create vehicle`,
  })
  createVehicle(
    @Body() payload: CreateVehicleDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = getUploadedFileUrl(file, 'vehicles') ?? payload.imageUrl;

    return this.vehiclesService.createVehicle(
      {
        ...payload,
        imageUrl,
      },
      file,
    );
  }

  @Patch('admin/vehicles/:id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateVehicleDto })
  @UseInterceptors(
    FileInterceptor(
      'imageUrl',
      getImageUploadOptions({
        folder: 'vehicles',
        prefix: 'vehicle',
        maxSizeMb: 10,
      }) as any,
    ),
  )
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} update vehicle`,
  })
  updateVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateVehicleDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = getUploadedFileUrl(file, 'vehicles') ?? payload.imageUrl;

    return this.vehiclesService.updateVehicle(
      id,
      {
        ...payload,
        imageUrl,
      },
      file,
    );
  }

  @Patch('admin/:id/disable')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} disable vehicle`,
  })
  disableVehicle(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.disableVehicle(id);
  }
}