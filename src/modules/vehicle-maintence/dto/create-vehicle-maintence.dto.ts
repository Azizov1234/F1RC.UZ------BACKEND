import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleMaintenanceStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateVehicleMaintenanceDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehicleId!: number;

  @ApiProperty({ example: 'Motor check' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({ example: 'Motor qizib ketyapti' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional({
    enum: VehicleMaintenanceStatus,
    example: VehicleMaintenanceStatus.OPEN,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsEnum(VehicleMaintenanceStatus)
  status?: VehicleMaintenanceStatus;


  @ApiPropertyOptional({ example: 'Battery ham tekshirildi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  @MaxLength(1000)
  notes?: string;
}