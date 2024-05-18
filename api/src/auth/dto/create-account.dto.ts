import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

import { ResetPasswordDto } from './reset-password.dto';

export class CreateAccountDto extends ResetPasswordDto {
  @ApiPropertyOptional({
    minLength: ConfigConstants.user.minDisplayNameLength,
    maxLength: ConfigConstants.user.maxDisplayNameLength,
    example: 'John Doe',
  })
  @IsString()
  @MinLength(ConfigConstants.user.minDisplayNameLength)
  @MaxLength(ConfigConstants.user.maxDisplayNameLength)
  @IsOptional()
  displayName?: string;
}
