import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtUtilsService } from './jwt.service';
import { BcryptUtilsService } from './bcrypt.service';

@Global()
@Module({
  imports: [
    JwtModule.register({}),
  ],
  providers: [JwtUtilsService, BcryptUtilsService],
  exports: [JwtUtilsService, BcryptUtilsService],
})
export class SecurityModule {}