import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    ExperienceLevel,
    VehicleControlType,
    VehicleStatus,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateIf,
} from 'class-validator';

export class GetVehiclesQueryDto {
    @ApiPropertyOptional({ example: 1 })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10 })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ example: '' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
    @IsString()
    search?: string;

    @ApiPropertyOptional({ example: '' })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
    @IsString()
    categorySlug?: string;

     @ApiPropertyOptional({ example: '' })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
    @IsString()
    categoryName?: string;

    @ApiPropertyOptional({
        enum: VehicleStatus,
    })
    @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
    @IsEnum(VehicleStatus)
    status?: VehicleStatus;

    @ApiPropertyOptional({
        enum: ExperienceLevel,
    })
    @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
    @IsEnum(ExperienceLevel)
    difficulty?: ExperienceLevel;

    @ApiPropertyOptional({
        enum: VehicleControlType,
    })
    @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
    @IsEnum(VehicleControlType)
    controlType?: VehicleControlType;

    @ApiPropertyOptional({ example: true })
    @Transform(({ value }) => {
        if (value === '' || value === undefined || value === null) return undefined;
        return value === true || value === 'true';
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        enum: [
            'id',
            'name',
            'topSpeedKmh',
            'batteryLifeMinutes',
            'sortOrder',
            'createdAt',
            'updatedAt',
        ],
        example: 'createdAt',
    })
    @IsOptional()
    @IsIn([
        'id',
        'name',
        'topSpeedKmh',
        'batteryLifeMinutes',
        'sortOrder',
        'createdAt',
        'updatedAt',
    ])
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}


export class PublicVehiclesQueryDto {
    @ApiPropertyOptional({ example: 1 })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10 })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}