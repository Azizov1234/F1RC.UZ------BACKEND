import { Module } from '@nestjs/common';
import { VehicleMaintenceService } from './vehicle-maintence.service';
import { VehicleMaintenceController } from './vehicle-maintence.controller';

@Module({
  controllers: [VehicleMaintenceController],
  providers: [VehicleMaintenceService],
})
export class VehicleMaintenceModule {}
