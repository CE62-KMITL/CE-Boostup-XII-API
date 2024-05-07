import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthConstants } from 'src/auth/constants';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(AuthConstants.minPasswordLength)
  @MaxLength(AuthConstants.maxPasswordLength)
  password: string;
}
