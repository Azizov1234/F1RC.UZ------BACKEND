import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { SecurityModule } from './common/utils/security.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    
    PrismaModule,
    SecurityModule,
    AuthModule,
  ]
})
export class AppModule { }
