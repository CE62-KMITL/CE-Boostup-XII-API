import { IsString, MaxLength, MinLength } from 'class-validator';
import { AuthConstants } from 'src/auth/constants';

export class ResetPasswordDto {
  @IsString()
  @MinLength(AuthConstants.minPasswordLength)
  @MaxLength(AuthConstants.maxPasswordLength)
  password: string;

  // @IsBase64()
  @IsString()
  token: string;
}
