import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { SecurityModule } from './common/utils/security.module';
import { UsersModule } from './modules/users/users.module';
import { SeedModule } from './core/prisma/seed/seed.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CategoriesModule } from './modules/categories/categories.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    PrismaModule,
    SecurityModule,
    AuthModule,
    UsersModule,
    SeedModule,
    ProfilesModule,
    CategoriesModule,
    VehiclesModule
  ]
})
export class AppModule { }
