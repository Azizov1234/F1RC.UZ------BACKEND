import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ExperienceLevel,
  VehicleControlType,
  VehicleStatus,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: "" })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null
      ? undefined
      : Number(value),
  )
  @IsInt()
  @Min(1)
  categoryId!: number;

  @ApiProperty({ example: '' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: "" })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  @MaxLength(140)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug faqat kichik harf, raqam va - bo‘lishi kerak',
  })
  slug?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: "" })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null
      ? undefined
      : Number(value),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  topSpeedKmh?: number;

  @ApiPropertyOptional({ example: "" })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null
      ? undefined
      : Number(value),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  batteryLifeMinutes?: number;

  @ApiPropertyOptional({
    enum: VehicleControlType,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsEnum(VehicleControlType)
  controlType?: VehicleControlType;

  @ApiPropertyOptional({
    enum: ExperienceLevel,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsEnum(ExperienceLevel)
  difficulty?: ExperienceLevel;

  @ApiPropertyOptional({
    enum: VehicleStatus,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({
    example: '',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null
      ? undefined
      : Number(value),
  )
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}