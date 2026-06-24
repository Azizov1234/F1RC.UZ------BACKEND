import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateArenaDto {
  @ApiProperty({ example: '' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: '' })
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

  @ApiPropertyOptional({ example: '' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: '' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({
    example: '',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
}