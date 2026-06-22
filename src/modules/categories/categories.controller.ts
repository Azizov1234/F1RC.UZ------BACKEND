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

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GetCategoriesQueryAdminsDto } from './dto/filter.dto';
import { Roles } from 'src/common/decorators/role';
import {
  getImageUploadOptions,
  getUploadedFileUrl,
} from 'src/common/functions/multer-file-upload';

@ApiTags('Categories')
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Get('public')
  @ApiOperation({
    summary: 'Public categories list',
  })
  getPublicCategories(@Query() query: GetCategoriesQueryAdminsDto) {
    return this.categoriesService.getPublicCategories(query);
  }

  @Get('one/:categorieId')
  @ApiOperation({
    summary: 'Public category detail',
    description: 'Faqat active categoryni qaytaradi.',
  })
  getPublicCategory(@Param('categorieId', ParseIntPipe) categorieId: number) {
    return this.categoriesService.getPublicCategory(categorieId);
  }

  @Get('admin')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN}, ${UserRole.OPERATOR}`,
  })
  getAdminCategories(@Query() query: GetCategoriesQueryAdminsDto) {
    return this.categoriesService.getAdminCategories(query);
  }

  @Get('admin/:categorieId')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN}, ${UserRole.OPERATOR}`,
  })
  getAdminCategory(@Param('categorieId', ParseIntPipe) categorieId: number) {
    return this.categoriesService.getAdminCategory(categorieId);
  }

  @Post('admin')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateCategoryDto })
  @UseInterceptors(
    FileInterceptor(
      'imageUrl',
      getImageUploadOptions({
        folder: 'categories',
        prefix: 'category',
        maxSizeMb: 5,
      }) as any,
    ),
  )
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN}`,
  })
  createCategory(
    @Body() payload: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = getUploadedFileUrl(file, 'categories') ?? payload.imageUrl;

    return this.categoriesService.createCategory(
      {
        ...payload,
        imageUrl,
      },
      file,
    );
  }

  @Patch('admin/:categorieId')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateCategoryDto })
  @UseInterceptors(
    FileInterceptor(
      'imageUrl',
      getImageUploadOptions({
        folder: 'categories',
        prefix: 'category',
        maxSizeMb: 5,
      }) as any,
    ),
  )
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN}`,
  })
  updateCategory(
    @Param('categorieId', ParseIntPipe) categorieId: number,
    @Body() payload: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = getUploadedFileUrl(file, 'categories') ?? payload.imageUrl;

    return this.categoriesService.updateCategory(
      categorieId,
      {
        ...payload,
        imageUrl,
      },
      file,
    );
  }

  @Delete('admin/:categorieId')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.SUPERADMIN}`,
  })
  deleteCategory(@Param('categorieId', ParseIntPipe) categorieId: number) {
    return this.categoriesService.deleteCategory(categorieId);
  }
}