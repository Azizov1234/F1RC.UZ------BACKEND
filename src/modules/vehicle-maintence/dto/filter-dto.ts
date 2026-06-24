import { ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleMaintenanceStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class GetVehicleMaintenencesQueryDto {
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

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  vehicleId?: number;

  @ApiPropertyOptional({ enum: VehicleMaintenanceStatus })
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsEnum(VehicleMaintenanceStatus)
  status?: VehicleMaintenanceStatus;

  @ApiPropertyOptional({ example: 'motor' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['id', 'startedAt', 'resolvedAt', 'createdAt', 'updatedAt'],
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(['id', 'startedAt', 'resolvedAt', 'createdAt', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}