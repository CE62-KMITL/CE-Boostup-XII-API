import { IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from 'src/auth/constants';

export class ResetPasswordDto {
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(MAX_PASSWORD_LENGTH)
  password: string;

  // @IsBase64()
  @IsString()
  token: string;
}
