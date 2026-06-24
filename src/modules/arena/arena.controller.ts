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
  UseGuards,
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

import { CreateArenaDto } from './dto/create-arena.dto';
import { ActiveOrDisactiveArenaDto, UpdateArenaDto } from './dto/update-arena.dto';
import {
  GetArenasQueryDto,
  PublicArenasQueryDto,
} from './dto/filter-dto';
import { ArenasService } from './arena.service';
import { RoleGuard } from 'src/common/guards/role.guard';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('Arenas')
@Controller()
export class ArenasController {
  constructor(private readonly arenasService: ArenasService) {}

  @Get('arenas')
  @ApiOperation({ summary: 'Public arenas list' })
  getPublicArenas(@Query() query: PublicArenasQueryDto) {
    return this.arenasService.getPublicArenas(query);
  }

  @Get('arenas/:id')
  @ApiOperation({ summary: 'Public arena detail' })
  getPublicArenaById(@Param('id', ParseIntPipe) id: number) {
    return this.arenasService.getPublicArenaById(id);
  }

  @Get('admin/arenas')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} arenas list`,
  })
  getAdminArenas(@Query() query: GetArenasQueryDto) {
    return this.arenasService.getAdminArenas(query);
  }

  @Get('admin/arenas/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} arena detail`,
  })
  getAdminArenaById(@Param('id', ParseIntPipe) id: number) {
    return this.arenasService.getAdminArenaById(id);
  }

  @Post('admin/arenas')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateArenaDto })
  @UseInterceptors(
    FileInterceptor(
      'coverImageUrl',
      getImageUploadOptions({
        folder: 'arenas',
        prefix: 'arena',
        maxSizeMb: 5,
      }) as any,
    ),
  )
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} create arena`,
  })
  createArena(
    @Body() payload: CreateArenaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const coverImageUrl =
      getUploadedFileUrl(file, 'arenas') ?? payload.coverImageUrl;

    return this.arenasService.createArena(
      {
        ...payload,
        coverImageUrl,
      },
      file,
    );
  }

  @Patch('admin/arenas/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateArenaDto })
  @UseInterceptors(
    FileInterceptor(
      'coverImageUrl',
      getImageUploadOptions({
        folder: 'arenas',
        prefix: 'arena',
        maxSizeMb: 5,
      }) as any,
    ),
  )
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} update arena`,
  })
  updateArena(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateArenaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const coverImageUrl =
      getUploadedFileUrl(file, 'arenas') ?? payload.coverImageUrl;

    return this.arenasService.updateArena(
      id,
      {
        ...payload,
        coverImageUrl,
      },
      file,
    );
  }

  @Patch('admin/arenas/:id/active-or-disactive')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} active or disactive arena`,
  })
  activeOrDisactiveArena(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ActiveOrDisactiveArenaDto,
  ) {
    return this.arenasService.activeOrDisactiveArena(id, payload);
  }
}