import { NestFactory } from '@nestjs/core';

import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);

  try {
    const seedService = app.get(SeedService);

    await seedService.run();
  } finally {
    await app.close();
  }
}

bootstrap();