import {
  Body,
  Controller,
  NotImplementedException,
  Post,
} from '@nestjs/common';
import { CreateAccountDto } from 'src/auth/dto/create-account.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { RequestAccountCreationDto } from 'src/auth/dto/request-account-creation.dto';
import { RequestPasswordResetDto } from 'src/auth/dto/request-password-reset.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    throw new NotImplementedException(loginDto);
  }

  @Post('request-account-creation')
  requestAccountCreation(
    @Body() requestAccountCreationDto: RequestAccountCreationDto,
  ) {
    throw new NotImplementedException(requestAccountCreationDto);
  }

  @Post('create-account')
  createAccount(@Body() createAccountDto: CreateAccountDto) {
    throw new NotImplementedException(createAccountDto);
  }

  @Post('request-password-reset')
  requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ) {
    throw new NotImplementedException(requestPasswordResetDto);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    throw new NotImplementedException(resetPasswordDto);
  }
}
