import { PartialType } from '@nestjs/swagger';
import { CreateArenaDto } from './create-arena.dto';

export class UpdateArenaDto extends PartialType(CreateArenaDto) {}


import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class ActiveOrDisactiveArenaDto {
  @ApiProperty({ example: false })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive!: boolean;
}