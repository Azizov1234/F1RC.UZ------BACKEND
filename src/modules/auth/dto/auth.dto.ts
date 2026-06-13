import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsMobilePhone,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        example: '',
        description: 'Userning to‘liq ismi',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(60)
    fullName!: string;

    @ApiProperty({
        example: '',
        description: 'Telefon raqam',
    })
    @IsString()
    @IsNotEmpty()
    @IsMobilePhone('uz-UZ')
    phone!: string;

    @ApiPropertyOptional({
        example: '',
        description: 'Email majburiy emas',
    })
    @Transform(({ value }) => {
        if (value === '') return undefined;
        return value;
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        example: '',
        description: 'Parol',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(32)
    password!: string;
}

export class LoginDto {
    @ApiProperty({
        example: '',
        description: 'Telefon raqam',
    })
    @IsString()
    @IsNotEmpty()
    @IsMobilePhone('uz-UZ')
    phone!: string;

    @ApiProperty({
        example: '',
        description: 'Parol',
    })
    @IsString()
    @IsNotEmpty()
    password!: string;
}

export class LogOutDto {
    @ApiProperty({
        example: '',
        description: 'Refresh Token',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken!: string;
}

export class RefreshDto {
    @ApiProperty({
        example: '',
        description: 'Refresh Token',
    })
    @IsNotEmpty()
    @IsString()
    refreshToken!:string
}