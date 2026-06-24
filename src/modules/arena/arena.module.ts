import { Module } from '@nestjs/common';
import { ArenasController } from './arena.controller';
import { ArenasService } from './arena.service';

@Module({
  controllers: [ArenasController],
  providers: [ArenasService],
})
export class ArenaModule {}
