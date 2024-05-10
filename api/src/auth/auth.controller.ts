import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { LoginDto } from './dto/login.dto';
import { RequestAccountCreationDto } from './dto/request-account-creation.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto.username, loginDto.password);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('request-account-creation')
  async requestAccountCreation(
    @Body() requestAccountCreationDto: RequestAccountCreationDto,
  ) {
    return await this.authService.requestAccountCreation(
      requestAccountCreationDto.email,
      requestAccountCreationDto.siteUrl,
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('create-account')
  async createAccount(@Body() createAccountDto: CreateAccountDto) {
    return await this.authService.createAccount(
      createAccountDto.token,
      createAccountDto.password,
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('request-password-reset')
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ) {
    return await this.authService.requestPasswordReset(
      requestPasswordResetDto.email,
      requestPasswordResetDto.siteUrl,
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }
}
