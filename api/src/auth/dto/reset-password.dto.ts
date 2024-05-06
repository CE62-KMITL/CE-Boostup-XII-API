import { IsJWT, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthConstants } from 'src/auth/constants';

export class ResetPasswordDto {
  @IsString()
  @MinLength(AuthConstants.minPasswordLength)
  @MaxLength(AuthConstants.maxPasswordLength)
  password: string;

  @IsString()
  @IsJWT()
  token: string;
}
