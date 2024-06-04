import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsUrl, MaxLength } from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

export class RequestPasswordResetDto {
  @ApiProperty({
    type: 'string',
    maxLength: ConfigConstants.user.maxEmailLength,
    example: 'admin@example.com',
  })
  @MaxLength(ConfigConstants.user.maxEmailLength)
  @IsEmail()
  email: string;

  @ApiProperty({ type: 'uri', example: 'https://www.ceboostup.com' })
  @IsUrl()
  siteUrl: string;
}
