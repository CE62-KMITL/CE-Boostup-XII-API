import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsUrl } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'example@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'https://www.ceboostup.com' })
  @IsUrl()
  siteUrl: string;
}
