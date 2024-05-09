import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsStrongPassword, MaxLength } from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

export class ResetPasswordDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzNDU2Nzg5LCJuYW1lIjoiSm9zZXBoIn0.OpOSSw7e485LOP5PrzScxHb7SR6sAOMRckfFwi4rp7o',
  })
  @IsJWT()
  token: string;

  @ApiProperty({
    minLength: ConfigConstants.user.minPasswordLength,
    maxLength: ConfigConstants.user.maxPasswordLength,
    example: 'P@ssw0rd!',
  })
  @MaxLength(ConfigConstants.user.maxPasswordLength)
  @IsStrongPassword({
    minLength: ConfigConstants.user.minPasswordLength,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
