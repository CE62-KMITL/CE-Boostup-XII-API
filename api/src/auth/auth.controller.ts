import { Controller, NotImplementedException, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  login() {
    throw new NotImplementedException();
  }

  @Post('request-account-creation')
  requestAccountCreation() {
    throw new NotImplementedException();
  }

  @Post('create-account')
  createAccount() {
    throw new NotImplementedException();
  }

  @Post('request-password-reset')
  requestPasswordReset() {
    throw new NotImplementedException();
  }

  @Post('reset-password')
  resetPassword() {
    throw new NotImplementedException();
  }
}
