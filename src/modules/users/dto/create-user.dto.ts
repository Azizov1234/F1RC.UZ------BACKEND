import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Ali Valiyev' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  @IsMobilePhone('uz-UZ')
  phone!: string;

  @ApiPropertyOptional({ example: 'ali@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    enum: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.TEAM_MANAGER],
    example: UserRole.TEAM_MANAGER,
  })
  @IsIn([UserRole.ADMIN, UserRole.OPERATOR, UserRole.TEAM_MANAGER])
  role!: UserRole
}