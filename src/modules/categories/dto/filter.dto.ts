import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export enum CategorySortBy {
    ID = 'id',
    NAME = 'name',
    SORT_ORDER = 'sortOrder',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class GetCategoriesQueryAdminsDto {
    @ApiPropertyOptional({
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({
        example: 10,
        default: 10,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    @ApiPropertyOptional({
        example: '',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        example: ""
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        enum: CategorySortBy,
        default: CategorySortBy.SORT_ORDER,
    })
    @IsOptional()
    @IsEnum(CategorySortBy)
    sortBy: CategorySortBy = CategorySortBy.SORT_ORDER;

    @ApiPropertyOptional({
        enum: SortOrder,
        default: SortOrder.ASC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder: SortOrder = SortOrder.ASC;
}


export class GetCategoriesQueryPublicDto {
    @ApiPropertyOptional({
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({
        example: 10,
        default: 10,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    @ApiPropertyOptional({
        example: '',
    })
    @IsOptional()
    @IsString()
    search?: string;
    
}