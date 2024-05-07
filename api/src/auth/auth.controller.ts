import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { CreateAccountDto } from 'src/auth/dto/create-account.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { RequestAccountCreationDto } from 'src/auth/dto/request-account-creation.dto';
import { RequestPasswordResetDto } from 'src/auth/dto/request-password-reset.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('request-account-creation')
  requestAccountCreation(
    @Body() requestAccountCreationDto: RequestAccountCreationDto,
  ) {
    return this.authService.requestAccountCreation(requestAccountCreationDto);
  }

  @Post('create-account')
  createAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.authService.createAccount(createAccountDto);
  }

  @Post('request-password-reset')
  requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ) {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
