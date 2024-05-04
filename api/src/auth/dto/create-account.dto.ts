import { IsString, MaxLength } from 'class-validator';
import { MAX_DISPLAY_NAME_LENGTH } from 'src/auth/constants';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';

export class CreateAccountDto extends ResetPasswordDto {
  @IsString()
  @MaxLength(MAX_DISPLAY_NAME_LENGTH)
  displayName: string;
}
