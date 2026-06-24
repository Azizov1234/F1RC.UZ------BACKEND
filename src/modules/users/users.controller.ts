import {
  Body,
  Controller,
  Delete,
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

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersQueryDto } from './dto/filters.dto';

import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { CurrentUser } from 'src/common/decorators/current-user';
import type { AuthUser } from 'src/common/types/auth.user.type';

import {
  getImageUploadOptions,
  getUploadedFileUrl,
} from 'src/common/functions/multer-file-upload';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} users list`,
  })
  @Get('all')
  getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.getAllUsers(query);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get user by id. User can see own data, ADMIN/SUPERADMIN can see others',
  })
  @Get('one/:id')
  getUserById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.getUserById(id, user);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateUserDto })
  @UseInterceptors(
    FileInterceptor(
      'avatarUrl',
      getImageUploadOptions({
        folder: 'users',
        prefix: 'user',
        maxSizeMb: 5,
      }) as any,
    ),
  )
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} create user`,
  })
  @Post('create/one')
  createUser(
    @Body() payload: CreateUserDto,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const avatarUrl = getUploadedFileUrl(file, 'users') ?? payload.avatarUrl;

    return this.usersService.createUser(
      {
        ...payload,
        avatarUrl,
      },
      user,
    );
  }

  @UseGuards(AuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateUserDto })
  @UseInterceptors(
    FileInterceptor(
      'avatarUrl',
      getImageUploadOptions({
        folder: 'users',
        prefix: 'user',
        maxSizeMb: 5,
      }) as any,
    ),
  )
  @ApiOperation({
    summary: 'Update user. User can update own data, ADMIN/SUPERADMIN can update others',
  })
  @Patch('update/one/:id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateUserDto,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const avatarUrl = getUploadedFileUrl(file, 'users') ?? payload.avatarUrl;

    return this.usersService.updateUser(
      id,
      {
        ...payload,
        avatarUrl,
      },
      user,
    );
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN} delete user`,
  })
  @Delete('delete/one/:id')
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.deleteUser(id, user);
  }
}