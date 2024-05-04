import { IsString } from 'class-validator';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';

export class CreateAccountDto extends ResetPasswordDto {
  @IsString()
  displayName: string;
}
