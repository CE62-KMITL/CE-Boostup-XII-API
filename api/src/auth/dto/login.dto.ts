import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

export class LoginDto {
  @ApiProperty({
    type: 'string',
    maxLength: ConfigConstants.user.maxEmailLength,
    example: 'example@example.com',
  })
  @MaxLength(ConfigConstants.user.maxEmailLength)
  @IsEmail()
  username: string;

  @ApiProperty({ type: 'string', example: 'P@ssw0rd!' })
  @IsString()
  password: string;
}
