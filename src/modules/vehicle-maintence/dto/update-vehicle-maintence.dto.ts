import { PartialType } from '@nestjs/swagger';
import { CreateVehicleMaintenanceDto } from './create-vehicle-maintence.dto';

export class UpdateVehicleMaintenceDto extends PartialType(CreateVehicleMaintenanceDto) {}
