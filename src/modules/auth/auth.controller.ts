import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto, LogOutDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user';
import type { AuthUser } from 'src/common/types/auth.user.type';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'Register new user' })
  @Post('register')
  register(@Body() payload: RegisterDto, @Req() req: any) {
    return this.authService.register(payload, req);
  }

  @ApiOperation({ summary: 'Login user' })
  @Post('login')
  login(@Body() payload: LoginDto, @Req() req: any) {
    return this.authService.login(payload, req);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return {
      success: true,
      user,
    };
  }
  @ApiOperation({ summary: 'Logout user session' })
  @Post('logout')
  logout(@Body() payload: LogOutDto) {
    return this.authService.logout(payload);
  }

  @ApiOperation({summary:'Take a new AccessToken with RefreshToken update'})
  @Post("refresh")
  refresh(@Body() refreshToken:RefreshDto){
    
    return this.authService.refresh(refreshToken)
  }
}