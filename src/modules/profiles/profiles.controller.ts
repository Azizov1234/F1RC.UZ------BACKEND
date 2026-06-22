import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';

import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CurrentUser } from 'src/common/decorators/current-user';
import { Roles } from 'src/common/decorators/role';
import type { AuthUser } from 'src/common/types/auth.user.type';

import {
  getImageUploadOptions,
  getUploadedFileUrl,
} from 'src/common/functions/multer-file-upload';

@ApiTags('Profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.profilesService.getMyProfile(user);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileDto })
  @UseInterceptors(
    FileInterceptor(
      'avatarUrl',
      getImageUploadOptions({
        folder: 'profiles',
        prefix: 'avatar',
        maxSizeMb: 5,
      }) as any,
    ),
  )
  @ApiOperation({ summary: 'Update my profile with avatar' })
  updateMyProfile(
    @Body() payload: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
    @CurrentUser() user?: AuthUser,
  ) {
    const avatarUrl = getUploadedFileUrl(avatar, 'profiles') ?? payload.avatarUrl;

    return this.profilesService.updateMyProfile(
      {
        ...payload,
        avatarUrl
      },
      user!,
    );
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('one/:userId')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN}`,
  })
  getProfileByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.profilesService.getProfileByUserId(userId);
  }
}