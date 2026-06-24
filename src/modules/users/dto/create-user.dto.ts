import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Ali Valiyev' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: '+998901234567' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+998|998)?\d{9}$/, {
    message: 'Phone format noto‘g‘ri. Masalan: +998901234567',
  })
  phone!: string;

  @ApiPropertyOptional({ example: 'ali@gmail.com' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    const email = value.trim().toLowerCase();
    return email === '' ? undefined : email;
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    enum:UserRole,
    example: "",
  })
  @IsIn([
    UserRole.ADMIN,
    UserRole.OPERATOR,
    UserRole.TEAM_MANAGER,
    UserRole.RACER,
  ])
  role!: UserRole;
}