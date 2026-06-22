import {
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

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GetCategoriesQueryAdminsDto } from './dto/filter.dto';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async getAdminCategories(query: GetCategoriesQueryAdminsDto) {
        let { page, limit, search, isActive, sortBy, sortOrder } = query;

        page = Math.max(Number(page) || 1, 1);
        limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

        const skip = (page - 1) * limit;
        search = search?.trim();

        const where: Prisma.RacingCategoryWhereInput = {
            ...(isActive !== undefined ? { isActive } : {}),

            ...(search
                ? {
                    OR: [
                        {
                            name: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            slug: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            description: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            trackType: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            speedRange: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    ],
                }
                : {}),
        };

        sortBy = sortBy ?? 'createdAt';
        sortOrder = sortOrder ?? 'desc';

        const [categories, total] = await this.prisma.$transaction([
            this.prisma.racingCategory.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                select: this.categorySelect(),
            }),

            this.prisma.racingCategory.count({
                where,
            }),
        ]);

        const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

        return {
            success: true,
            message: 'Admin categories fetched successfully',
            data: categories.map((category) => this.formatAdminCategory(category)),
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

    async getPublicCategories(query: GetCategoriesQueryAdminsDto) {
        let { page, limit, search } = query;

        page = Math.max(Number(page) || 1, 1);
        limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

        const skip = (page - 1) * limit;
        search = search?.trim();

        const where: Prisma.RacingCategoryWhereInput = {
            isActive: true,

            ...(search
                ? {
                    OR: [
                        {
                            name: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            slug: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            description: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            trackType: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            speedRange: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    ],
                }
                : {}),
        };

        const [categories, total] = await this.prisma.$transaction([
            this.prisma.racingCategory.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    {
                        sortOrder: 'asc',
                    },
                    {
                        createdAt: 'desc',
                    },
                ],
                select: this.categorySelect(),
            }),

            this.prisma.racingCategory.count({
                where,
            }),
        ]);

        const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

        return {
            success: true,
            message: 'Categories fetched successfully',
            data: categories.map((category) => this.formatPublicCategory(category)),
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

    async getPublicCategory(id: number) {
        const category = await this.prisma.racingCategory.findFirst({
            where: {
                id,
                isActive: true,
            },
            select: this.categorySelect(),
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return {
            success: true,
            message: 'Category fetched successfully',
            category: this.formatPublicCategory(category),
        };
    }

    async getAdminCategory(id: number) {
        const category = await this.prisma.racingCategory.findUnique({
            where: { id },
            select: this.categorySelect(),
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return {
            success: true,
            message: 'Category fetched successfully',
            category: this.formatAdminCategory(category),
        };
    }

    async createCategory(
        payload: CreateCategoryDto,
        file?: Express.Multer.File,
    ) {
        const slug = payload.slug
            ? this.createSlug(payload.slug)
            : await this.createUniqueSlug(payload.name);

        try {
            const category = await this.prisma.racingCategory.create({
                data: {
                    name: payload.name,
                    slug,
                    description: payload.description,
                    speedRange: payload.speedRange,
                    trackType: payload.trackType,
                    imageUrl: payload.imageUrl,
                    isActive: payload.isActive ?? true,
                    sortOrder: payload.sortOrder ?? 0,
                },
                select: this.categorySelect(),
            });

            return {
                success: true,
                message: 'Category created successfully',
            };
        } catch (error: any) {
            if (file) {
                await deleteUploadedFile(file);
            }
            if (error?.code === 'P2002') {
                throw new ConflictException('Category slug already exists');
            }

            throw error;
        }
    }

    async updateCategory(
        id: number,
        payload: UpdateCategoryDto,
        file?: Express.Multer.File,
    ) {
        const oldCategory = await this.prisma.racingCategory.findUnique({
            where: { id },
            select: {
                id: true,
                imageUrl: true,
            },
        });

        if (!oldCategory) {
            await deleteUploadedFile(file);
            throw new NotFoundException('Category not found');
        }

        const slug = payload.slug
            ? this.createSlug(payload.slug)
            : payload.name
                ? await this.createUniqueSlug(payload.name, id)
                : undefined;

        try {
            const category = await this.prisma.racingCategory.update({
                where: { id },
                data: {
                    ...(payload.name !== undefined && {
                        name: payload.name,
                    }),

                    ...(slug !== undefined && {
                        slug,
                    }),

                    ...(payload.description !== undefined && {
                        description: payload.description,
                    }),

                    ...(payload.speedRange !== undefined && {
                        speedRange: payload.speedRange,
                    }),

                    ...(payload.trackType !== undefined && {
                        trackType: payload.trackType,
                    }),

                    ...(payload.imageUrl !== undefined && {
                        imageUrl: payload.imageUrl,
                    }),

                    ...(payload.isActive !== undefined && {
                        isActive: payload.isActive,
                    }),

                    ...(payload.sortOrder !== undefined && {
                        sortOrder: payload.sortOrder,
                    }),
                },
                select: this.categorySelect(),
            });

            if (file && oldCategory.imageUrl) {
                await deleteFile(oldCategory.imageUrl);
            }

            return {
                success: true,
                message: 'Category updated successfully',
            };
        } catch (error: any) {
            await deleteUploadedFile(file);

            if (error?.code === 'P2002') {
                throw new ConflictException('Category slug already exists');
            }

            throw error;
        }
    }

    async deleteCategory(id: number) {
        const category = await this.prisma.racingCategory.findUnique({
            where: { id },
            select: {
                id: true,
                isActive: true,
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        if (!category.isActive) {
            return {
                success: true,
                message: 'Category already deactivated',
            };
        }

        await this.prisma.racingCategory.update({
            where: { id },
            data: {
                isActive: false,
            },
        });

        return {
            success: true,
            message: 'Category deactivated successfully',
        };
    }

    private createSlug(value: string) {
        const slug = value
            .toLowerCase()
            .trim()
            .replace(/['‘’`]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        return slug || 'category';
    }

    private async createUniqueSlug(name: string, ignoreId?: number) {
        const baseSlug = this.createSlug(name);

        let slug = baseSlug;
        let counter = 1;

        while (
            await this.prisma.racingCategory.findFirst({
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

    private categorySelect() {
        return {
            id: true,
            name: true,
            slug: true,
            description: true,
            speedRange: true,
            trackType: true,
            imageUrl: true,
            isActive: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true,
        };
    }

    private formatPublicCategory(category: any) {
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            speedRange: category.speedRange,
            trackType: category.trackType,
            imageUrl: category.imageUrl,
            sortOrder: category.sortOrder,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }

    private formatAdminCategory(category: any) {
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            speedRange: category.speedRange,
            trackType: category.trackType,
            imageUrl: category.imageUrl,
            isActive: category.isActive,
            sortOrder: category.sortOrder,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
}