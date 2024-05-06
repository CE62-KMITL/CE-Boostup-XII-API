import { IsString, MaxLength } from 'class-validator';
import { AuthConstants } from 'src/auth/constants';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';

export class CreateAccountDto extends ResetPasswordDto {
  @IsString()
  @MaxLength(AuthConstants.maxDisplayNameLength)
  displayName: string;
}
