import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../service/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { AuthGuard } from '../guard/auth.guard';
import { Request } from 'express';
import { AccountDisabledGuard } from '../guard/account-disabled.guard';
import { EmailDto } from 'src/shared/dto/email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  //TODO MAKE ANOTHER GUARD FOR CHECK THE TYPE OF TOKEN
  @UseGuards(AuthGuard, AccountDisabledGuard)
  @Get('refresh-token')
  refreshToken(@Req() request: Request) {
    const { id: userId } = request['user'];
    return this.authService.getRefreshToken(userId);
  }

  // TODO update the reset password
  @Post('reset-password')
  resetPassword(@Body() email: EmailDto) {
    return this.authService.getNewPasswordHashed(email);
  }
}
