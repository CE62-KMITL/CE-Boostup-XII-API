import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsUrl, MaxLength } from 'class-validator';
import { ConfigConstants } from 'src/config/config-constants';

export class RequestPasswordResetDto {
  @ApiProperty({
    maxLength: ConfigConstants.user.maxEmailLength,
    example: 'example@example.com',
  })
  @MaxLength(ConfigConstants.user.maxEmailLength)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'https://www.ceboostup.com' })
  @IsUrl()
  siteUrl: string;
}
